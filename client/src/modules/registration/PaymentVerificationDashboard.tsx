import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Check, X, Eye, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { PaymentVerification } from "./types";

interface PaymentVerificationDashboardProps {
  registrations: PaymentVerification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function PaymentVerificationDashboard({
  registrations,
  onApprove,
  onReject
}: PaymentVerificationDashboardProps) {
  const [selectedRegistration, setSelectedRegistration] = useState<PaymentVerification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const pendingPayments = registrations.filter(r => r.paymentStatus === "submitted");
  const verifiedPayments = registrations.filter(r => r.paymentStatus === "verified");
  const rejectedPayments = registrations.filter(r => r.paymentStatus === "rejected");

  const getTeamInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: "Pending", className: "bg-muted text-muted-foreground" },
      submitted: { icon: AlertCircle, label: "Awaiting Review", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      verified: { icon: CheckCircle2, label: "Verified", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
      rejected: { icon: XCircle, label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (registration: PaymentVerification) => {
    setSelectedRegistration(registration);
    setShowDetailDialog(true);
  };

  const handleApprove = (id: string) => {
    onApprove(id);
    setShowDetailDialog(false);
  };

  const handleReject = (id: string) => {
    onReject(id);
    setShowDetailDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedPayments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedPayments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Payment Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No registrations yet
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((registration) => (
                  <TableRow key={registration.id} data-testid={`row-registration-${registration.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getTeamInitials(registration.teamName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{registration.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {registration.contactEmail || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(registration.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(registration)}
                          data-testid={`button-view-${registration.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>

                        {registration.paymentStatus === "submitted" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(registration.id)}
                              data-testid={`button-approve-${registration.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(registration.id)}
                              data-testid={`button-reject-${registration.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Registration Details</DialogTitle>
            <DialogDescription>
              Review payment proof and transaction information
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Team Name</p>
                  <p className="font-medium">{selectedRegistration.teamName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{selectedRegistration.contactEmail || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {new Date(selectedRegistration.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRegistration.paymentStatus)}
                </div>
              </div>

              {selectedRegistration.paymentTransactionId && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <Card>
                    <CardContent className="p-3">
                      <code className="text-sm">{selectedRegistration.paymentTransactionId}</code>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedRegistration.paymentProofUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                  <ScrollArea className="h-96 rounded-md border">
                    <img
                      src={selectedRegistration.paymentProofUrl}
                      alt="Payment proof"
                      className="w-full"
                    />
                  </ScrollArea>
                </div>
              )}

              {selectedRegistration.paymentStatus === "submitted" && (
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedRegistration.id)}
                    data-testid="button-reject-detail"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRegistration.id)}
                    data-testid="button-approve-detail"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve & Add to Tournament
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
