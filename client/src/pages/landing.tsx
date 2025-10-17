import { Car, Calendar, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DriveHub</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Driving Instructor Management Made Simple
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Streamline your driving school operations with powerful tools for scheduling lessons,
              tracking student progress, and managing payments.
            </p>
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login" className="text-base">
                Get Started
              </a>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover-elevate">
              <CardContent className="p-8">
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Effortlessly manage lesson bookings with an intuitive calendar interface and conflict detection.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-8">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Student Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor student progress, hours completed, and maintain comprehensive notes for each learner.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-8">
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Payment Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track payments, manage invoices, and get clear visibility into your financial operations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-8">
                <Car className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">
                  Tailored dashboards for students, instructors, and administrators with appropriate permissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 mb-16">
          <div className="max-w-2xl mx-auto bg-card border border-card-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Driving School?</h2>
            <p className="text-muted-foreground mb-6">
              Join hundreds of instructors who are already using DriveHub to grow their business.
            </p>
            <Button size="lg" asChild>
              <a href="/api/login">Start Free Trial</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 DriveHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
