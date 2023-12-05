import { execSync } from 'child_process';
import axios from 'axios';
// Function to get gcloud access token
function getAccessToken() {
    try {
        // Execute 'gcloud auth print-access-token' and capture the output
        const accessToken = execSync('gcloud auth print-access-token').toString().trim();
        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        return null;
    }
}

function extractJSON(text) { 

  const regex = /```JSON([\s\S]*?)```/s;
  const match = text.match(regex);

  if (match) {
    const extractedJSONString = match[1];
    try {
      const extractedJSON = JSON.parse(extractedJSONString);
      return extractedJSON
    } catch (error) {
      return error.message;
    }
  } else {
    console.error('No match found');
  }
}

const getListRecommendation = async (req, res) => {
  const ingredient = req.body.ingredient;
  const query = `Generate recommendations for heavy meals (if any), beverages (if any), and snacks (if any) made from or containing the ingredient ${ingredient}. For every result (foods, drinks, snacks), only give text of their name. Present the results in JSON format as follows:
{
"foods": [],
"drinks": [],
"snacks": []
}"

Note : 
1. Do not make unreasonable recommendations. 
2. Don't consider food to be a drink
3. Don't consider drink to be a food
4. Don't consider snack to be a food
5. Don't consider food to be a snack
6. Don't consider drink to be a snack
7. Don't consider snack to be a drink`

  const accessToken = getAccessToken();
  if (!accessToken) {
    res.status(500).json({ error: 'Unable to retrieve access token' });
    return;
  }

  try {
    const response = await axios.post(
      `https://${process.env.PALM_API_ENDPOINT}/v1/projects/${process.env.PROJECT_ID}/locations/${process.env.PALM_LOCATION}/publishers/google/models/${process.env.PALM_MODEL_ID}:predict`,
      {
        instances: [
          {
            content: query,
          },
        ],
        parameters: {
          candidateCount: 1,
          maxOutputTokens: 1024,
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    ); 
    res.json(extractJSON(response.data.predictions[0].content));
  } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

const getHowToMake = async (req, res) => {
  const dishName = req.body.dishName;
  const query = `Generate a guide on how to prepare the dish/drink ${dishName}. Present the results in JSON format as follows:
{
"description": "string",
"ingredient": [],
"procedure": {
"main_procedure": [],
"other_procedure": [
{
"title": "string",
"procedure": []
},
{
...
}
]
}
}

Note : "Other procedure" are intended for procedures for processing ingredients that are not the main food/drink
`

  const accessToken = getAccessToken();
  if (!accessToken) {
    res.status(500).json({ error: 'Unable to retrieve access token' });
    return;
  }

  try {
    const response = await axios.post(
      `https://${process.env.PALM_API_ENDPOINT}/v1/projects/${process.env.PROJECT_ID}/locations/${process.env.PALM_LOCATION}/publishers/google/models/${process.env.PALM_MODEL_ID}:predict`,
      {
        instances: [
          {
            content: query,
          },
        ],
        parameters: {
          candidateCount: 1,
          maxOutputTokens: 1024,
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.json(extractJSON(response.data.predictions[0].content));
  } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default {
  getListRecommendation,
  getHowToMake,
}