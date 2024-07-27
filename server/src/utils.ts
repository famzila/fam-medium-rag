import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesPath = path.join(__dirname, '../dataset/fam-articles-dataset.json');
export const SORRY_NO_ANSWER = "I'm sorry, I don't know the answer to that.";
export const INVOCATION_FAILED= "Model invocation failed.";
export function loadDataset() {
    const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    let dataset: { id: string; content: string; link: string; }[] = []; // Initialize as an empty array
    for (const [index, a] of articles.slice(0, 150).entries()) {
        // Split the content starting from "\n\nThat's it for today, see ya"
        const cleanedContent= a.content.split("\n\nThat's it for today, see ya")[0];
        dataset.push({
            id: a.id,
            content: cleanedContent,
            link: "https://medium.com/p/"+a.id,
        });
    }
    return dataset;
}

export function formatChatHistory(messages: string[]){
    // format history as alternating messages from human and assistant, if even index human, if odd assistant
    return messages.map((msg, i) => {
        if(i%2 === 0){
            return ["Human", msg];
        }
        return ["Assistant", msg];
    }).join('\n');
}

export async function formatDataset(){
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
    return {contents, metadata};
}

export const logResult = (label) => (result) => {
    console.log(`${label}:`, result);
    return result;
};