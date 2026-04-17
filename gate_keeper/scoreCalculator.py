import json
from langchain_core.prompts import PromptTemplate

#Calculate the score of Fidety to Context
def cal_integrity(docChunk):
    """
    https://arxiv.org/abs/2509.09360
    In general, they split one answer into several fact/short phrases, 
    then change these phrases into different mutations, 
    and finally check whether these different mutations can still be supported by the original context.
    """
    #Fidelity-to-Context 
    score=0
    return score

#Calculate the score of Fidelity to Reality
#We first separate the claims from each retrieved document chunk
#Then we verify the truthfulness of each claim by searching google and comparing the search results with the claim

def cal_truthfulness(docChunk,llm):#only accept one chunked document at a time
    #Fidelity-to-Reality

    extractResult = extract_claim_from_one_chunk(docChunk,llm)
    
    if type(extractResult) == str:
        #situation 1, 3, 4: no claim found, llm returns not a valid Json format, error occurs during JSON parsing
        print(f"Claim extraction issue for this chunk: {extractResult}")
        chunkScore=-1
    else:
        claimsSumScore = 0
        #multiple claims found, return the list of claims
        for i,claim in enumerate(extractResult,1):
            print(f"Claim {i}: {claim}")
            claimsSumScore += cal_score_of_one_claim(claim)

        chunkScore = claimsSumScore/len(extractResult)    
   
    return chunkScore

def extract_claim_from_one_chunk(docChunk,llm):
    #Extract the claim from one chunked document
    prompt = PromptTemplate.from_template("""
    Please extract the claim from the following document chunk.
    A factual claim is a statement that can be verified as true or false.
    If there are multiple claims, please list them all. 
    If there is no claim, please say "No claim found".
    
    Document Chunk:
    {docChunk}
    
    Return ONLY valid JSON in the following format,do not say anything else:
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
    

    #ensure the response is in string format
    if hasattr(response, "content"):
        response_text = response.content
    else:
        response_text = str(response)

    #Situation 1: No claim found
    if response_text == "No claim found":
        return "No claim found"

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


def cal_score_of_one_claim(claim):
    """
        From https://arxiv.org/abs/2401.00396/... Natural Language Inference (NLI) based detection,
        There are three labels for NLI: entailment, contradiction and neutral for each claim.
    """    
    #(Temporary)Score=0.35*SourceQuality+0.25*Recency+0.25*CrossSourceAgreement+0.15*FieldMatch of each claim
    
    

    claimScore = 0
    return claimScore