import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_COLLECTION_NAME, QDRANT_URL_PORT, QDRANT_API_KEY, QDRANT_API_URL, OPENAI_API_KEY } from "../config";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough,RunnableSequence } from "@langchain/core/runnables";
import { formatChatHistory } from "./utils";


let relevantLinks :string[]=[];
function combineDocuments(docs: { pageContent: string , metadata: {url: string}}[]) {
    // Save top 3 relevant links
    relevantLinks.push(...docs.map((doc) => doc.metadata.url));
    // Combine the context of the 3 documents
    const context = docs.map((doc) => doc.pageContent).join('\n');
    return context;
}

(async () => {

    const client = new QdrantClient({ url: QDRANT_API_URL, port: QDRANT_URL_PORT, apiKey: QDRANT_API_KEY });
    const embeddings = new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY });   

    // If vector store already exists
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            client,
            collectionName: QDRANT_COLLECTION_NAME,
        }
    );

    // create a retriever from the vector store and always retrieve the top 3 most similar documents
    const retriever = vectorStore.asRetriever(3);

    // Create a prompt for the RAG model
    const llm = new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0, apiKey: OPENAI_API_KEY });
    const standaloneQuestionTemplate = `Given some conversation hitory (if any) and a question, transform the question into a standalone question. 
    Conversation history: {chat_history}
    Question: {question} 
    Standalone question: `;
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

    // In order to give a relevent answer to a question, we need to use both original question (that has more informations) and standalone one
    const answerTemplate = `You are an assistant for question-answering tasks.
    Use the following pieces of retrieved context to answer the question as well as the conversation history.
    If you don't know the answer, just say I'm sorry, I don't knwo the answer to that. Don't try to make up an answer.
    Be firendly and use three sentences maximum and keep the answer concise. 
    Context: {context}
    Question: {question}
    Conversation history: {chat_history}`;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

    const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser());
    const retrievalChain = RunnableSequence.from([
        prevResult => prevResult.standalone_question,
        retriever,
        combineDocuments,
    ]);
    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());


    // Add memory capabilities to the chatbot
    const chatHistory: string[]= [];
    const mainChain = RunnableSequence.from([
        {
            standalone_question: standaloneQuestionChain,
            original_input: new RunnablePassthrough(),
        },
        {
            context: retrievalChain,
            question: ({ original_input }) => original_input.question,
            chat_history: ({ original_input }) => original_input.chat_history,
        },
        answerChain,
    ]);

    const repsonse = await mainChain.invoke(
        { 
            question: "What's new on angular 17? what's defferable feature? what's standalone component? what should I learn",
            chat_history: formatChatHistory(chatHistory) 
        
        });
    console.log(repsonse);
    console.log("Learn more about the topic at the following links: ", relevantLinks);


})();
