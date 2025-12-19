import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Grid3x3, Repeat, FileText } from "lucide-react";
import type { InsertTournament } from "@shared/schema";
import RegistrationFormBuilder from "@/modules/registration/RegistrationFormBuilder";
import { RegistrationPlatformProvider, defaultPlatformAdapter } from "@/modules/registration/platform-adapter";
import type { RegistrationFormConfig } from "@/modules/registration/types";
import ImageUploadField from "@/components/ImageUploadField";

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tournament: InsertTournament & { teamNames: string[]; registrationConfig?: RegistrationFormConfig }) => void;
}

export default function CreateTournamentDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: CreateTournamentDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [prizeReward, setPrizeReward] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [format, setFormat] = useState<"round_robin" | "single_elimination" | "swiss">("single_elimination");
  const [swissRounds, setSwissRounds] = useState(3);
  const [enableRegistration, setEnableRegistration] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationFormConfig | undefined>();
  const [teamCapacityMode, setTeamCapacityMode] = useState<"unlimited" | "specific">("unlimited");
  const [maxTeams, setMaxTeams] = useState("16");
  
  // Use ref to store the latest config from RegistrationFormBuilder
  const latestConfigRef = useRef<RegistrationFormConfig | undefined>();

  const handleRegistrationChange = useCallback((config: RegistrationFormConfig) => {
    console.log('[CREATE-DIALOG] Registration config updated:', JSON.stringify(config, null, 2));
    // Store in both state (for UI) and ref (for guaranteed latest value on submit)
    latestConfigRef.current = config;
    setRegistrationConfig(config);
  }, []);

  const formats = [
    {
      id: "single_elimination",
      name: "Single Elimination",
      icon: Trophy,
      description: "Teams compete in knockout rounds until one winner remains",
      pros: ["Fast and exciting", "Clear progression", "Best for time-limited events"],
    },
    {
      id: "round_robin",
      name: "Round Robin",
      icon: Repeat,
      description: "Every team plays against every other team",
      pros: ["Fair and comprehensive", "All teams get equal matches", "Best for leagues"],
    },
    {
      id: "swiss",
      name: "Swiss System",
      icon: Grid3x3,
      description: "Teams paired based on performance without elimination",
      pros: ["Balanced competition", "No elimination", "Flexible duration"],
    },
  ];

  const handleSubmit = () => {
    const totalTeams = teamCapacityMode === "unlimited" ? -1 : parseInt(maxTeams) || 16;
    
    // Get registration config from the ref (most up-to-date) or state
    const finalConfig = enableRegistration ? (latestConfigRef.current || registrationConfig) : undefined;
    
    console.log('[SUBMIT] Creating tournament with:', {
      enableRegistration,
      configExists: !!finalConfig,
      stepsCount: finalConfig?.steps?.length || 0,
      steps: finalConfig?.steps?.map(s => ({ title: s.stepTitle, fieldCount: s.fields?.length || 0 })) || []
    });
    
    onSubmit({
      name,
      game,
      imageUrl: imageUrl || null,
      prizeReward: prizeReward || null,
      entryFee: entryFee || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      platform: platform || null,
      region: region || null,
      format: format as any,
      totalTeams,
      swissRounds: format === "swiss" ? swissRounds : null,
      teamNames: [],
      registrationConfig: finalConfig,
    });
    handleReset();
  };

  const handleReset = () => {
    setStep(1);
    setName("");
    setGame("");
    setImageUrl("");
    setPrizeReward("");
    setEntryFee("");
    setStartDate("");
    setEndDate("");
    setPlatform("");
    setRegion("");
    setFormat("single_elimination");
    setSwissRounds(3);
    setEnableRegistration(false);
    setRegistrationConfig(undefined);
    setTeamCapacityMode("unlimited");
    setMaxTeams("16");
    onOpenChange(false);
  };

  const canProceedStep1 = name.trim().length > 0 && game.trim().length > 0;
  const canProceedStep2 = true;
  const canProceedStep3 = !enableRegistration || (registrationConfig !== undefined);
  const totalSteps = 3;

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Tournament Details";
      case 2: return "Select Format";
      case 3: return "Registration Setup (Optional)";
      default: return "";
    }
  };

  return (
    <RegistrationPlatformProvider value={defaultPlatformAdapter}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create Tournament</DialogTitle>
            <DialogDescription>
              Step {step} of {totalSteps}: {getStepTitle()}
            </DialogDescription>
          </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Championship 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-tournament-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="game">Game</Label>
              <Input
                id="game"
                placeholder="e.g., Valorant, CS:GO, League of Legends"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                data-testid="input-tournament-game"
              />
            </div>
            <ImageUploadField
              label="Tournament Poster"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="https://example.com/poster.jpg"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prizeReward">Prize Pool</Label>
                <Input
                  id="prizeReward"
                  placeholder="e.g., $1,000, No Prize, TBA"
                  value={prizeReward}
                  onChange={(e) => setPrizeReward(e.target.value)}
                  data-testid="input-tournament-prize"
                />
                <p className="text-xs text-muted-foreground">Enter any text or leave blank</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entryFee">Entry Fee</Label>
                <Input
                  id="entryFee"
                  placeholder="e.g., FREE, $5, ₦1000"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  data-testid="input-tournament-entry-fee"
                />
                <p className="text-xs text-muted-foreground">Enter any text or leave blank</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-tournament-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-tournament-end-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  placeholder="e.g., PC, Xbox, PlayStation, Mobile"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  data-testid="input-tournament-platform"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  placeholder="e.g., NA, EU, APAC, Global"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  data-testid="input-tournament-region"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
              <div className="grid gap-4">
                {formats.map((f) => (
                  <Label
                    key={f.id}
                    htmlFor={f.id}
                    className="cursor-pointer"
                  >
                    <Card className={`hover-elevate ${format === f.id ? 'ring-2 ring-primary' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                              <f.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-display">{f.name}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {f.description}
                              </CardDescription>
                            </div>
                          </div>
                          <RadioGroupItem value={f.id} id={f.id} />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {f.pros.map((pro, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {pro}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                ))}
              </div>
            </RadioGroup>

            {format === "swiss" && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="rounds">Number of Rounds</Label>
                <Input
                  id="rounds"
                  type="number"
                  min="1"
                  max="10"
                  value={swissRounds}
                  onChange={(e) => setSwissRounds(parseInt(e.target.value) || 3)}
                  data-testid="input-swiss-rounds"
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            {/* Team Capacity Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Capacity</CardTitle>
                <CardDescription>Set the maximum number of teams allowed to register</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={teamCapacityMode} onValueChange={(v) => setTeamCapacityMode(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlimited" id="unlimited" />
                    <Label htmlFor="unlimited" className="cursor-pointer font-normal">
                      Unlimited teams
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific" className="cursor-pointer font-normal">
                      Set maximum number of teams
                    </Label>
                  </div>
                </RadioGroup>

                {teamCapacityMode === "specific" && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="maxTeams">Maximum Teams</Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      min="1"
                      max="1000"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                      placeholder="e.g., 16, 32, 64"
                      data-testid="input-max-teams"
                    />
                    <p className="text-xs text-muted-foreground">
                      Teams will not be able to register once this limit is reached
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration Form Builder */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="font-semibold">Custom Registration Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Add custom fields to the registration form
                  </p>
                </div>
              </div>
              <Switch
                checked={enableRegistration}
                onCheckedChange={setEnableRegistration}
                data-testid="switch-enable-registration"
              />
            </div>

            {enableRegistration && (
              <div className="border rounded-lg p-4">
                <RegistrationFormBuilder
                  tournamentId="new"
                  onSave={handleRegistrationChange}
                  initialConfig={registrationConfig}
                />
              </div>
            )}

            {!enableRegistration && (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                <p className="text-sm">Custom registration form is optional.</p>
                <p className="text-xs mt-2">Enable above to add custom fields like "Game Username", "Team Size", etc.</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              data-testid="button-back"
            >
              Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
              data-testid="button-next"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceedStep3}
              data-testid="button-create-tournament"
            >
              Create Tournament
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </RegistrationPlatformProvider>
  );
}
