import TournamentCard from '../TournamentCard';

export default function TournamentCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TournamentCard 
        tournament={{
          id: "1",
          name: "Summer Championship 2024",
          format: "single_elimination",
          status: "in_progress",
          totalTeams: 8,
          currentRound: 2,
          swissRounds: null,
          createdAt: new Date(),
          totalMatches: 7,
          completedMatches: 3,
        }}
        onView={(id) => console.log('View tournament:', id)}
      />
      <TournamentCard 
        tournament={{
          id: "2",
          name: "League Season 5",
          format: "round_robin",
          status: "upcoming",
          totalTeams: 6,
          currentRound: 1,
          swissRounds: null,
          createdAt: new Date(),
          totalMatches: 15,
          completedMatches: 0,
        }}
        onView={(id) => console.log('View tournament:', id)}
      />
      <TournamentCard 
        tournament={{
          id: "3",
          name: "Winter Open",
          format: "swiss",
          status: "completed",
          totalTeams: 12,
          currentRound: 4,
          swissRounds: 4,
          createdAt: new Date(),
          totalMatches: 24,
          completedMatches: 24,
        }}
        onView={(id) => console.log('View tournament:', id)}
      />
    </div>
  );
}
