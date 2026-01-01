import { useState } from "react";
import SubmitScoreDialog from '../SubmitScoreDialog';
import { Button } from "@/components/ui/button";

export default function SubmitScoreDialogExample() {
  const [open, setOpen] = useState(false);

  const team1 = { id: "1", name: "Alpha Squad", tournamentId: "t1", wins: 2, losses: 0, points: 6 };
  const team2 = { id: "2", name: "Beta Force", tournamentId: "t1", wins: 1, losses: 1, points: 3 };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Score Dialog</Button>
      <SubmitScoreDialog 
        open={open}
        onOpenChange={setOpen}
        team1={team1}
        team2={team2}
        onSubmit={(winnerId, team1Score, team2Score) => {
          console.log('Score submitted:', { winnerId, team1Score, team2Score });
          setOpen(false);
        }}
      />
    </div>
  );
}
