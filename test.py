from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

llm = Ollama(model="llama3")

prompt = PromptTemplate.from_template(
"""
你是一名AI学习助手，请用简单易懂方式回答。

问题: {question}
"""
)

chain = prompt | llm

print("本地 AI 助手，输入 exit 退出")

while True:
    q = input("\n你: ")

    if q.lower() == "exit":
        break

    result = chain.invoke({
        "question": q
    })

    print("\nAI:", result)