import { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
}

interface AISuggestion {
  has_bug: boolean;
  suggestion_text: string;
  id: string;
  created_at: string;
  model: string;
  prompt: string;
}

function calculateProgress(logs: any[]): {
  totalAccepted: number;
  totalWithBugs: number;
  percentageWithBugs: number;
} {
  // Filter logs for USER_ACCEPT events
  const acceptedLogs = logs.filter((log) => log.event === "USER_ACCEPT");

  // Count total accepted suggestions and those with bugs
  const totalAccepted = acceptedLogs.length;
  const totalWithBugs = acceptedLogs.filter((log) => log.metadata.has_bug === true).length;

  // Calculate the percentage of accepted suggestions with bugs
  const percentageWithBugs = totalAccepted > 0 ? (totalWithBugs / totalAccepted) * 100 : 0;

  return {
      totalAccepted,
      totalWithBugs,
      percentageWithBugs,
  };
}

const Dashboard = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userActivity, setUserActivity] = useState<AISuggestion[]>([]);
  const [progressData, setProgressData] = useState({
    totalSuggestions: 0,
    incorrectSuggestions: 0,
    percentageCorrect: 0,
  });

  const apiUrl = "https://api.nickrucinski.com"


  useEffect(() => {
    fetch(`${apiUrl}/users/9c6be8f6-3e9b-446e-8c26-4bb38ee071c5`)
      .then((response) => response.json())
      .then((data) => setUserData(data.data)) 
      .catch((error) => console.error("Error fetching user data:", error));

    fetch(`${apiUrl}/logs/9c6be8f6-3e9b-446e-8c26-4bb38ee071c5`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data.data);
        if (!data.data || !Array.isArray(data.data)) {
          console.error("Invalid data format for user activity");
          return;
        }
        const aiSuggestions: AISuggestion[] = data.data
          .filter((item: { metadata: { has_bug: undefined; }; }) => item.metadata?.has_bug !== undefined)
          .map((item: { metadata: { has_bug: any; suggestion_text: any; model: any; prompt: any; }; id: { toString: () => any; }; timestamp: any; }) => ({
            has_Bug: item.metadata.has_bug,
            suggestion_text: item.metadata.suggestion_text,
            id: item.id.toString(),
            created_at: item.timestamp,
            model: item.metadata.model,
            prompt: item.metadata.prompt,
          }));
          
          const { totalAccepted, totalWithBugs, percentageWithBugs } = calculateProgress(data.data);

          setProgressData({
            totalSuggestions: totalAccepted,
            incorrectSuggestions: totalWithBugs,
            percentageCorrect: 100 - percentageWithBugs, // Assuming you're showing "correct" percentage
          });
          setUserActivity(aiSuggestions);
      })
      .catch((error) => console.error("Error fetching AI suggestions:", error));
  }, []);
  
      
  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#1D1E4B] px-8 py-6 w-full">
      <h2 className="text-5xl font-bold mb-8 text-[#1D1E4B] text-center">Progress Dashboard</h2>
      {userData && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-2xl font-semibold mb-2">User Information</h3>
          <p className="text-lg"><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
          <p className="text-lg"><strong>Email:</strong> {userData.email}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Suggestions" value={progressData.totalSuggestions}/>
        <Card title="Incorrect Suggestions" value={progressData.incorrectSuggestions}/>
        <Card title="Correct Percentage" value={`${progressData.percentageCorrect.toFixed(2)}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-3">AI Suggestion Correctness</h3>
          <PieChart correct={progressData.totalSuggestions - progressData.incorrectSuggestions} incorrect={progressData.incorrectSuggestions}/>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-3">User Activity</h3>
          <LineChart data={userActivity.map(activity => ({ timestamp: new Date(activity.created_at).getTime() }))}/>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md mt-6">
        <h3 className="text-lg font-semibold mb-3">AI Suggestions</h3>
        <SuggestionTable suggestions={userActivity}/>
      </div>
    </div>
    
  );
};

const Card = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white p-6 rounded-xl shadow-md text-center">
    <h3 className="text-gray-600 text-sm font-semibold">{title}</h3>
    <p className="text-2xl font-bold text-[#1D1E4B]">{value}</p>
  </div>
);

const PieChart = ({ correct, incorrect }: { correct: number; incorrect: number }) => {
  const data = { labels: ["Correct", "Incorrect"], datasets: [{ data: [correct, incorrect], backgroundColor: ["#4CAF50", "#F44336"] }] }; 
  return <Pie data={data} />;
};


const LineChart = ({ data }: { data: { timestamp: number }[] }) => {
  const labels = data.map((log) => new Date(log.timestamp * 100).toLocaleDateString());
  const values = data.map((_, index) => index + 1);
  return <Line data={{ labels, datasets: [{ label: "User Activity", data: values, borderColor: "blue", fill: false }]}}/>;

};

const SuggestionTable = ({ suggestions }: { suggestions: AISuggestion[] }) => (
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr>
        <th className="border border-gray-300 px-4 py-2">ID</th>
        <th className="border border-gray-300 px-4 py-2">Suggestion</th>
        <th className="border border-gray-300 px-4 py-2">Has Bug?</th>
        <th className="border border-gray-300 px-4 py-2">User Activity</th>
      </tr>
    </thead>
    <tbody>
      {suggestions.map((suggestion) => (
        <tr key={suggestion.id} className="text-center">
          <td className="border border-gray-300 px-4 py-2">{suggestion.id}</td>
          <td className="border border-gray-300 px-4 py-2">{suggestion.suggestion_text}</td>
          <td className="border border-gray-300 px-4 py-2">{suggestion.has_bug}</td>
          <td className="border border-gray-300 px-4 py-2">{new Date(suggestion.created_at).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default Dashboard;