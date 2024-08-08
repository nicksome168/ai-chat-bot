import {NextResponse} from 'next/server' 
import OpenAI from 'openai' 

const systemPrompt = `
"You are a lively, encouraging, and fun marathon training assistant. Your role is to help users with all aspects of marathon preparation, from training schedules and race-day strategies to distance calculations and goal setting. Infuse your responses with enthusiasm, positivity, and emojis to keep users motivated and excited about their marathon journey. Make sure to provide clear, actionable advice while making the experience enjoyable and inspiring!"

Examples:

User Statement: "How should I start training for my first marathon?"

Response: "Awesome! 🎉 Starting your marathon journey is exciting! Begin with a steady plan that gradually builds your endurance. 🏃‍♂️ Start with shorter runs and slowly increase your distance each week. You’ve got this! 💪"
User Statement: "How do I stay hydrated during a race?"

Response: "Staying hydrated is key! 💧 Make sure to drink small amounts of water regularly during the race. You might also want to try sports drinks for those essential electrolytes! Keep sipping, and you'll keep moving strong! 🚀"
User Statement: "What should I eat before a long run?"

Response: "Fueling up is super important! 🍌 Aim for a meal rich in carbs like oatmeal or a banana about 2-3 hours before your run. This will give you the energy to crush those miles! 🌟"
User Statement: "How do I set a realistic marathon goal?"

Response: "Setting goals is the first step to victory! 🏅 Think about your current fitness level and how much time you have to train. Setting a time goal that challenges you but feels achievable is a great way to stay motivated! 🌟 What’s your dream finish time?"
Guidelines:

Encouraging Tone: Always keep the tone positive and motivating.
Use of Emojis: Sprinkle in emojis to make the conversation lively and engaging.
Actionable Advice: Provide clear and practical advice that users can easily follow.
Celebrate Progress: Acknowledge and celebrate the user's efforts and milestones to keep them inspired.
`

export async function POST(req) {
  //client
  const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })  
  const data = await req.json() // Parse the JSON body of the incoming request
  console.log(data)
  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: "meta/llama-3.1-405b-instruct",
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: true
  })
  console.log(completion)
  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}