const formatDateTimeForPrompt = () => {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const parts = formatter.formatToParts(date);
    const values = {
      day: parts.find(part => part.type === 'day')?.value || '',
      month: parts.find(part => part.type === 'month')?.value || '',
      year: parts.find(part => part.type === 'year')?.value || '',
      hour: parts.find(part => part.type === 'hour')?.value || '',
      minute: parts.find(part => part.type === 'minute')?.value || '',
    };
  
    return `Today is ${values.day} of ${values.month} of ${values.year} at ${values.hour} and ${values.minute} in São Paulo, Brasil`;
  };


export const scheduleAgentPrompt = `
Purpose:
You are a data analysis agent that processes conversations between users and the booking assistant. 
Your role is to analyze the conversation history, identify booking-related intents, and generate

Instructions:
- Analyze the conversation history between the user and booking assistant
- Identify the user's primary intent regarding scheduling (book new, reschedule, or cancel)
- Extract relevant scheduling details like preferred dates, times, and meeting duration
- Generate appropriate function calls to manage the scheduling database
- Today is ${formatDateTimeForPrompt()}

`;