import json
from langchain_core.prompts import PromptTemplate

#Calculate the score of Fidety to Context
def cal_integrity(docChunk):
    #Fidelity-to-Context 
    score=0
    return score

#Calculate the score of Fidelity to Reality
#We first separate the claims from each retrieved document chunk
#Then we verify the truthfulness of each claim by searching google and comparing the search results with the claim

def cal_truthfulness(docChunk,llm):#only accept one chunked document at a time
    #Fidelity-to-Reality
    claimList = extract_claim_from_one_chunk(docChunk,llm)
    if type(claimList) == str:
        #situation 1, 3, 4: no claim found, llm returns not a valid Json format, error occurs during JSON parsing
        print(f"Claim extraction issue for this chunk: {claimList}")
        claimList_score=0
    else:
        #situation 2: multiple claims found, return the list of claims
        for claim in claimList:
            1
    score = 0 
    return score 

def extract_claim_from_one_chunk(docChunk,llm):
    #Extract the claim from one chunked document
    prompt = PromptTemplate.from_template("""
    Please extract the claim from the following document chunk.
    A factual claim is a statement that can be verified as true or false.
    If there are multiple claims, please list them all. 
    If there is no claim, please say "No claim found".
    
    Document Chunk:
    {docChunk}
    
    Return ONLY valid JSON in the following format:
    {{
    "claims": [
        "claim 1",
        "claim 2"
    ]
    }}
    """)
    
    final_prompt = prompt.invoke({
        "docChunk": docChunk.page_content
    })
    
    response = llm.invoke(final_prompt)
    #Situation 1: No claim found
    if response == "No claim found":
        return "No claim found"

    #ensure the response is in string format
    if hasattr(response, "content"):
        response_text = response.content
    else:
        response_text = str(response)

    #convert the response text to a JSON object
    try:
        result = json.loads(response_text)
        claimList = result.get("claims", [])
        if isinstance(claimList, list):
            #Situation 2: Multiple claims found, return the list of claims
            return claimList
        #Situation 3: llm returns not a valid Json format
        return "llm returns not a valid Json format"
    except Exception as e:
        print("Claim extraction failed:", e)
        print("Raw response:", response_text)
        #Situation 4: Error occurs during JSON parsing
        return "Error occurs during JSON parsing"

    return claimList