import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_COLLECTION_NAME, QDRANT_URL_PORT, QDRANT_API_KEY, QDRANT_API_URL, OPENAI_API_KEY } from "../config";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { loadDataset } from "./utils";


(async () => {
    // 1- Creating a client for Qdrant
    const client = new QdrantClient({ url: QDRANT_API_URL, port: QDRANT_URL_PORT, apiKey: QDRANT_API_KEY });
    const embeddings = new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY });

    // 2- Creating collection in Qdrant
    client.createCollection(QDRANT_COLLECTION_NAME, {
        vectors: { size: 1536, distance: "Manhattan" },
    });

    // 3- Load and prep dataset
    const database = await loadDataset();
    const formatedDataset = database.map((d: any) => {
        return {
            content: d.content,
            metadata: {
                id: d.id,
                url: d.link
            }
        };
    });
    const contents = formatedDataset.map((d: any) => d.content);
    const metadata = formatedDataset.map((d: any) => d.metadata);

    console.log("Loaded and formatted dataset: ", contents[0], metadata[0]);
    // 4- Create a vector store
    await QdrantVectorStore.fromTexts(
        contents,
        metadata,
        embeddings,
        {
            client,
            collectionName: QDRANT_COLLECTION_NAME,
        }
    );
})();
