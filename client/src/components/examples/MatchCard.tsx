import MatchCard from '../MatchCard';

export default function MatchCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MatchCard 
        match={{
          id: "1",
          tournamentId: "t1",
          team1Id: "1",
          team2Id: "2",
          winnerId: null,
          round: 1,
          status: "in_progress",
          team1Score: null,
          team2Score: null,
          isBye: 0,
        }}
        team1={{ id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 2, losses: 0, points: 6 }}
        team2={{ id: "2", name: "Beta Force", tournamentId: "t1", wins: 1, losses: 1, points: 3 }}
        onSubmitScore={(id) => console.log('Submit score for match:', id)}
        onViewChat={(id) => console.log('View chat for match:', id)}
      />
      <MatchCard 
        match={{
          id: "2",
          tournamentId: "t1",
          team1Id: "3",
          team2Id: "4",
          winnerId: "3",
          round: 1,
          status: "completed",
          team1Score: 16,
          team2Score: 12,
          isBye: 0,
        }}
        team1={{ id: "3", name: "Charlie Warriors", tournamentId: "t1", wins: 3, losses: 0, points: 9 }}
        team2={{ id: "4", name: "Delta Legends", tournamentId: "t1", wins: 0, losses: 3, points: 0 }}
      />
      <MatchCard 
        match={{
          id: "3",
          tournamentId: "t1",
          team1Id: "5",
          team2Id: null,
          winnerId: null,
          round: 2,
          status: "pending",
          team1Score: null,
          team2Score: null,
          isBye: 1,
        }}
        team1={{ id: "5", name: "Echo Champions", tournamentId: "t1", wins: 2, losses: 1, points: 6 }}
      />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Compact View</h4>
        <MatchCard 
          match={{
            id: "4",
            tournamentId: "t1",
            team1Id: "1",
            team2Id: "2",
            winnerId: "1",
            round: 2,
            status: "completed",
            team1Score: 21,
            team2Score: 18,
            isBye: 0,
          }}
          team1={{ id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 3, losses: 0, points: 9 }}
          team2={{ id: "2", name: "Beta Force", tournamentId: "t1", wins: 1, losses: 2, points: 3 }}
          compact
        />
      </div>
    </div>
  );
}
