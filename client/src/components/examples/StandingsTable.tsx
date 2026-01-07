import StandingsTable from '../StandingsTable';

export default function StandingsTableExample() {
  const teams = [
    { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 5, losses: 0, points: 15, game: null, isRemoved: 0 },
    { id: "2", name: "Beta Force", tournamentId: "t1", wins: 4, losses: 1, points: 12, game: null, isRemoved: 0 },
    { id: "3", name: "Charlie Warriors", tournamentId: "t1", wins: 3, losses: 2, points: 9, game: null, isRemoved: 0 },
    { id: "4", name: "Delta Legends", tournamentId: "t1", wins: 2, losses: 3, points: 6, game: null, isRemoved: 0 },
    { id: "5", name: "Echo Champions", tournamentId: "t1", wins: 1, losses: 4, points: 3, game: null, isRemoved: 0 },
    { id: "6", name: "Foxtrot Elite", tournamentId: "t1", wins: 0, losses: 5, points: 0, game: null, isRemoved: 0 },
  ];

  return <StandingsTable teams={teams} />;
}
