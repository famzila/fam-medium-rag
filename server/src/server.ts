import express from "express";
import cors from "cors";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_COLLECTION_NAME, QDRANT_URL_PORT, QDRANT_API_KEY, QDRANT_API_URL, OPENAI_API_KEY } from "../config";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { INVOCATION_FAILED, SORRY_NO_ANSWER, formatChatHistory, logResult } from "./utils";

const app = express();
app.use(cors());

const router = express.Router();
router.use(express.json());

const port = 8080
let chatHistory: string[] | null = [];
const client = new QdrantClient({ url: QDRANT_API_URL, port: QDRANT_URL_PORT, apiKey: QDRANT_API_KEY });
const embeddings = new OpenAIEmbeddings({ apiKey: OPENAI_API_KEY });
const llm = new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0, apiKey: OPENAI_API_KEY });

// Get the vector store (should already exists)
const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
        client,
        collectionName: QDRANT_COLLECTION_NAME,
    }
);

// create a retriever from the vector store and always retrieve the top 3 most similar documents
const retriever = vectorStore.asRetriever(3);

let relevantLinksHtml: string = "";
function combineDocuments(docs: { pageContent: string, metadata: { url: string } }[]) {
    
    const urls = docs.map(doc => doc.metadata.url);
    const context = docs.map(doc => doc.pageContent).join('\n');
    if(urls.length > 0) {
        relevantLinksHtml = `<br>Learn more:<br>${urls.map((link, index) => `<a href='${link.trim()}'>🔗 Article #${index+1}</a>`).join('')}`;
    } else {
        relevantLinksHtml = "";
    }

    return context;
}

router.post("/messages", async (req, res) => {
    // In case the question is not valid
    let question = req.body.question;
    if (!question) {
        return res.status(400).send({ error: 'Message is required' });
    }
    // Otherwise, keep track in the chat history
    chatHistory.push(question);

    // Correct/reformulate if necessary the question (template + prompt)
    const improvedQuestionTemplate = `Given some conversation hitory (if any) and a question, reformulate, correct and shorten the question if necessary. 
    Conversation history: {chat_history}
    Question: {question} 
    Corrected question: `;
    const improvedQuestionPrompt = PromptTemplate.fromTemplate(improvedQuestionTemplate);
    
    // Create the assistant prompt that will be used to answer the corrected question with the retrieved context and chat history (template +prompt)
    const answerTemplate = `You are an assistant for question-answering tasks.
    Use the following pieces of retrieved context to answer the question as well as the conversation history.
    If you don't know the answer, just say ${SORRY_NO_ANSWER}. Don't try to make up an answer.
    Be firendly and use three sentences maximum and keep the answer concise. 
    Context: {context}
    Question: {question}
    Conversation history: {chat_history}`;
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);
    
    // Creating Chains, correct the question prompt > retrieve context > answer the question
    const improvedQuestionChain = improvedQuestionPrompt.pipe(llm).pipe(new StringOutputParser());
    const retrievalChain = RunnableSequence.from([
        prevResult => prevResult.improved_question,
        retriever,
        combineDocuments,
    ]);
    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());
    
    // Invoking the model
    try {
        const mainChain = RunnableSequence.from([
            {
                improved_question: improvedQuestionChain.pipe(logResult('Improved Question')),
                original_input: new RunnablePassthrough().pipe(logResult('Original Input'))
            },
            {
                context: retrievalChain.pipe(logResult('Retrieved Context')),
                question: ({ original_input }) => original_input.question,
                chat_history: ({ original_input }) => original_input.chat_history,
            },
            answerChain.pipe(logResult('Final Answer')),
        ]);
        const response = await mainChain.invoke(
            {
                question: question,
                chat_history: formatChatHistory(chatHistory)// simple function the formats history as alternating messages from human and assistant, if even index human, if odd assistant
            });
        
        // Manage no response, send an HTTP 500 code
        if (!response) {
            return res.status(500).send({ error: INVOCATION_FAILED });
        }
        // Otherwise, push the new response to the history and send the response with relevant links
        chatHistory.push(response);
        if (response === SORRY_NO_ANSWER) {
            relevantLinksHtml = "";
        }
        return res.send({ answer: response, relevantLinksHtml: relevantLinksHtml });
    } catch (e) {
        return res.status(500).send({ error: INVOCATION_FAILED });
    }
});


app.use(router);
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})