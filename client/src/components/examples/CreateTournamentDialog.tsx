import { useState } from "react";
import CreateTournamentDialog from '../CreateTournamentDialog';
import { Button } from "@/components/ui/button";

export default function CreateTournamentDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CreateTournamentDialog 
        open={open}
        onOpenChange={setOpen}
        onSubmit={(tournament) => {
          console.log('Tournament created:', tournament);
          setOpen(false);
        }}
      />
    </div>
  );
}
