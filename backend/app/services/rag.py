"""Thin wrapper around the standalone RAG loop in ``mainPipeLine.py``.

The heavy dependencies (``langchain``, ``chromadb``, ``ollama``) are imported
lazily so the FastAPI process starts even when they are not installed. The
registry / validation endpoints work without a running Ollama daemon.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Any

from gate_keeper import scoreCalculator as sc

_REPO_ROOT = Path(__file__).resolve().parents[3]
_CORPUS_ROOT = _REPO_ROOT / "SF-Bench-mini"
_PERSIST_DIR = _REPO_ROOT / "chroma_db"

_PROMPT = """You are an AI learning assistant.
Please answer strictly based on the provided context.
If the answer is not in the context, clearly say "I don't know" and do not make up information.

Context:
{context}

Question:
{question}

Answer:
"""

_state: dict[str, Any] = {}
_lock = Lock()


@dataclass
class RetrievedChunk:
    content: str
    source_type: str | None
    integrity: int


@dataclass
class AskResult:
    answer: str
    chunks: list[RetrievedChunk]


def _build_pipeline() -> dict[str, Any]:
    """Build the retriever + LLM once. Raises a clear error if deps are missing."""
    try:
        from langchain_chroma import Chroma
        from langchain_community.document_loaders import TextLoader
        from langchain_community.embeddings import OllamaEmbeddings
        from langchain_community.llms import Ollama
        from langchain_core.prompts import PromptTemplate
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError as exc:
        raise RuntimeError(
            "RAG dependencies are not installed. Install langchain-community, "
            "langchain-chroma, langchain-text-splitters to enable /ask."
        ) from exc

    docs: list[Any] = []
    for folder in ("verified", "poisoned"):
        folder_path = _CORPUS_ROOT / folder
        if not folder_path.exists():
            continue
        for file_path in sorted(folder_path.iterdir()):
            if file_path.suffix != ".txt":
                continue
            loaded = TextLoader(str(file_path)).load()
            for doc in loaded:
                doc.metadata["source_type"] = folder
            docs.extend(loaded)

    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    embeddings = OllamaEmbeddings(model=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"))
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(_PERSIST_DIR),
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    llm = Ollama(model=os.getenv("OLLAMA_LLM_MODEL", "llama3"))
    prompt = PromptTemplate.from_template(_PROMPT)
    return {"retriever": retriever, "llm": llm, "prompt": prompt}


def _get_pipeline() -> dict[str, Any]:
    if _state.get("pipeline") is None:
        with _lock:
            if _state.get("pipeline") is None:
                _state["pipeline"] = _build_pipeline()
    return _state["pipeline"]


def ask(question: str) -> AskResult:
    pipeline = _get_pipeline()
    retrieved = pipeline["retriever"].invoke(question)
    context = "\n\n".join(doc.page_content for doc in retrieved)
    final_prompt = pipeline["prompt"].invoke({"context": context, "question": question})
    answer = pipeline["llm"].invoke(final_prompt)

    chunks = [
        RetrievedChunk(
            content=doc.page_content,
            source_type=doc.metadata.get("source_type"),
            integrity=sc.cal_integrity(doc.page_content),
        )
        for doc in retrieved
    ]
    return AskResult(answer=str(answer), chunks=chunks)
