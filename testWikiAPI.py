import wikipedia
import wikipediaapi

wiki = wikipediaapi.Wikipedia(
    user_agent='PADFI',
    language='en'
)

def get_top3_wiki_summaries(claim):

    results = wikipedia.search(claim)

    evidences = []

    for title in results[:3]:

        page = wiki.page(title)

        if page.exists() and page.summary:

            evidences.append({
                "title": page.title,
                "summary": page.summary
            })

    return evidences


claim = "AI was created in the 1920s"

docs = get_top3_wiki_summaries(claim)

for i, doc in enumerate(docs, 1):

    print(f"\n--- Evidence {i} ---")
    print("Title:", doc["title"])
    print("Summary:", doc["summary"][:300])