import os
import gate_keeper
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from gate_keeper import scoreCalculator

# 1. Load local documents
docs = []

base_dir = "SF-Bench-mini"

for folder in ["verified", "poisoned"]:
    
    path = os.path.join(base_dir, folder)
    
    for file in os.listdir(path):
        
        loader = TextLoader(os.path.join(path, file))
        
        loaded = loader.load()
        
        for d in loaded:
            d.metadata["source_type"] = folder
        
        docs.extend(loaded)

# 2. Split documents into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,#300 characters per chunk
    chunk_overlap=50#50 characters overlap between chunks
)

docs = text_splitter.split_documents(docs)#all chunked documents

# 3. Define the embedding model (local Ollama)
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# 4. Create the vector database
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# 5. Create the retriever
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})# 3 most relevant chunks

# 6. Define the local large language model
llm = Ollama(model="llama3")


#Version 1
#You are an AI learning assistant. 
#Please answer strictly based on the provided context. 
#If the answer is not in the context, 
#clearly say "I don't know" and do not make up information.

#Version 2
#You are an AI learning assistant.
#Use the provided context as the first source of truth.
#If the context contains the answer, answer based on it.
#If the context does not contain enough information, say:
#"I don't know from the provided context, but based on my general knowledge..."
#Then provide a clearly separated answer based on your own knowledge.

# 7. Define the prompt template
prompt = PromptTemplate.from_template("""
#You are an AI learning assistant. 
#Please answer strictly based on the provided context. 
#If the answer is not in the context, 
#clearly say "I don't know" and do not make up information.
                                      
Context:
{context}

Question:
{question}

Answer:
""")

print("Local RAG assistant. Type 'exit' to quit.")

while True:
    question = input("\nYou: ")

    if question.lower() == "exit":
        break

    # 8. Retrieve relevant document chunks
    retrieved_docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])

    # 9. Build the final prompt
    final_prompt = prompt.invoke({
        "context": context,
        "question": question
    })

    # 10. Call the LLM to generate the answer
    result = llm.invoke(final_prompt)

    print("\nRetrieved content:")
    for i, docChunk in enumerate(retrieved_docs, 1):
        print(f"\n--- Document Chunk {i} ---")
        print(docChunk.page_content)
        #gatekeeper display integrity score for each retrieved document
        print(f"\nThe Fidelity-to-Context score for this chunk is: {scoreCalculator.cal_integrity(docChunk)}")
        print(f"\nThe Fidelity-to-Reality score for this chunk is: {scoreCalculator.cal_truthfulness(docChunk,llm)}")

    print("\nAI:", result)