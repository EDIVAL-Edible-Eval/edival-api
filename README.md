# edival-api
A back-end API to forward requests and responses between Edival Android Application and deployed machine learning model in Vertex AI

## How to Run
1. Make .env file using .env.example as a template
2. Make sure you have nodejs (v16.16.0) and npm (v8.11.0) installed
3. For *development* Run the following commands
```
npm install
npm run start-dev
```
4. Your API is Running on http://localhost:3000
5. To build the API, run the following command
```
gcloud builds submit --region=us-central1 --tag us-central1-docker.pkg.dev/edival-402305/edival-docker-repo/edival-api-image:tag2
```