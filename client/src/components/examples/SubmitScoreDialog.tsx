import { useState } from "react";
import SubmitScoreDialog from '../SubmitScoreDialog';
import { Button } from "@/components/ui/button";

export default function SubmitScoreDialogExample() {
  const [open, setOpen] = useState(false);

  const team1 = { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 2, losses: 0, points: 6, game: null, isRemoved: 0 };
  const team2 = { id: "2", name: "Beta Force", tournamentId: "t1", wins: 1, losses: 1, points: 3, game: null, isRemoved: 0 };

  const handleSelectWinner = async (winnerId: string): Promise<void> => {
    console.log('Winner selected:', winnerId);
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Score Dialog</Button>
      <SubmitScoreDialog
        open={open}
        onOpenChange={setOpen}
        team1={team1}
        team2={team2}
        matchId="example-match-1"
        onSelectWinner={handleSelectWinner}
      />
    </div>
  );
}
