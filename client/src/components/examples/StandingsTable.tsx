import StandingsTable from '../StandingsTable';

export default function StandingsTableExample() {
  const teams = [
    { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 5, losses: 0, points: 15 },
    { id: "2", name: "Beta Force", tournamentId: "t1", wins: 4, losses: 1, points: 12 },
    { id: "3", name: "Charlie Warriors", tournamentId: "t1", wins: 3, losses: 2, points: 9 },
    { id: "4", name: "Delta Legends", tournamentId: "t1", wins: 2, losses: 3, points: 6 },
    { id: "5", name: "Echo Champions", tournamentId: "t1", wins: 1, losses: 4, points: 3 },
    { id: "6", name: "Foxtrot Elite", tournamentId: "t1", wins: 0, losses: 5, points: 0 },
  ];

  return <StandingsTable teams={teams} />;
}
