# FAM Medium Chatbot powered by Generative AI and RAG Technique

This project develops a chatbot that interacts with Medium articles using the Retrieval-Augmented Generation (RAG) technique. The frontend is built with Angular 18, leveraging modern features of Angular, and the backend is powered by Express.

Please give a ⭐ to the repository if you like it and find it useful!
## Getting Started

These instructions will help you set up a copy of the project running on your local machine for development and testing purposes.

### Prerequisites

- Node.js version >= 22
- Angular CLI version 18

### Installation

#### Frontend

1. **Navigate to the Client Directory:**
````
cd client
`````

2. **Install Dependencies:**
````
npm install
````

3. **Launch the Frontend:**
````
npm start

````

The frontend should now be accessible at `http://localhost:4200`.

#### Backend

1. **Navigate to the Server Directory:**
````
cd server

````

2. **Install Dependencies:**
````
npm install
`````

3. **Configure the Application:**

Update the `config.ts` file with your API keys and all necessary constants.

4. **Embed Articles:**

Run the script to embed articles into your vector store:
````
npm run embed-articles
````

Check your vector store in Qdrant to ensure the embeddings were created successfully.

5. **Launch the Server:**
````
npm start
`````

The server should now be running and accessible at `http://localhost:8080`.

## Usage

After starting both the frontend and backend, visit `http://localhost:4200` to interact with the chatbot. The chatbot interfaces with Medium articles, allowing for dynamic conversations based on the content of the articles.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
