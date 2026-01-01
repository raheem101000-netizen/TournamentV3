import BracketView from '../BracketView';

export default function BracketViewExample() {
  const teams = [
    { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 2, losses: 0, points: 6 },
    { id: "2", name: "Beta Force", tournamentId: "t1", wins: 2, losses: 0, points: 6 },
    { id: "3", name: "Charlie Warriors", tournamentId: "t1", wins: 1, losses: 1, points: 3 },
    { id: "4", name: "Delta Legends", tournamentId: "t1", wins: 0, losses: 2, points: 0 },
  ];

  const singleElimMatches = [
    {
      id: "sf1",
      tournamentId: "t1",
      team1Id: "1",
      team2Id: "4",
      winnerId: "1",
      round: 2,
      status: "completed" as const,
      team1Score: 21,
      team2Score: 15,
      isBye: 0,
    },
    {
      id: "sf2",
      tournamentId: "t1",
      team1Id: "2",
      team2Id: "3",
      winnerId: "2",
      round: 2,
      status: "completed" as const,
      team1Score: 19,
      team2Score: 17,
      isBye: 0,
    },
    {
      id: "final",
      tournamentId: "t1",
      team1Id: "1",
      team2Id: "2",
      winnerId: null,
      round: 1,
      status: "in_progress" as const,
      team1Score: null,
      team2Score: null,
      isBye: 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Single Elimination Bracket</h3>
        <BracketView 
          matches={singleElimMatches}
          teams={teams}
          format="single_elimination"
          onMatchClick={(id) => console.log('Match clicked:', id)}
        />
      </div>
    </div>
  );
}
