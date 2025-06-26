'use client';

import { useState } from 'react';
import { CheckCircle, Download, Smartphone, Play, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@kit/ui/dialog';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'download-infuse',
    title: 'Download Infuse 7',
    description: 'Get the best media player for iOS and Apple TV',
    completed: false,
    icon: <Download className="h-5 w-5" />,
  },
  {
    id: 'configure-jellyfin',
    title: 'Connect to Jellyfin',
    description: 'Automatically configure your media library',
    completed: false,
    icon: <Play className="h-5 w-5" />,
  },
  {
    id: 'explore-services',
    title: 'Explore Your Services',
    description: 'Check out Nextcloud, Radarr, and more',
    completed: false,
    icon: <Smartphone className="h-5 w-5" />,
  },
];

export function OnboardingGuide() {
  const [steps, setSteps] = useState<OnboardingStep[]>(onboardingSteps);
  const [showGuide, setShowGuide] = useState(false);

  const handleCompleteStep = (stepId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const isComplete = completedSteps === totalSteps;

  if (isComplete) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Complete these steps to get the most out of your home server
            </CardDescription>
          </div>
          <Badge variant="outline">
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.slice(0, 2).map((step) => (
            <div
              key={step.id}
              className="rounded-lg border bg-muted/50 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    step.icon
                  )}
                </div>
                <h4 className="font-medium">{step.title}</h4>
                {!step.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteStep(step.id)}
                    className="ml-auto"
                  >
                    {step.id === 'download-infuse' ? 'Download' : 'Configure'}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
          
          <Dialog open={showGuide} onOpenChange={setShowGuide}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                View Full Setup Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Complete Setup Guide</DialogTitle>
                <DialogDescription>
                  Follow these steps to set up your mobile apps and get the most out of your home server
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      step.completed
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed
                          ? 'bg-green-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      
                      {step.id === 'download-infuse' && (
                        <div className="space-y-2">
                          <p className="text-sm">
                            Infuse 7 is the best media player for streaming from your Jellyfin server:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Beautiful interface with rich metadata</li>
                            <li>Support for all video formats</li>
                            <li>Seamless integration with Jellyfin</li>
                          </ul>
                          {!step.completed && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteStep(step.id)}
                              className="mt-2"
                            >
                              Download from App Store
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {step.id === 'configure-jellyfin' && (
                        <div className="space-y-2">
                          <p className="text-sm">
                            Connect Infuse to your Jellyfin server automatically:
                          </p>
                          <div className="bg-muted p-3 rounded font-mono text-sm">
                            Server: {process.env.NEXT_PUBLIC_JELLYFIN_URL || 'http://your-server:8096'}
                          </div>
                          {!step.completed && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteStep(step.id)}
                              className="mt-2"
                            >
                              Auto-Configure
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {step.id === 'explore-services' && (
                        <div className="space-y-2">
                          <p className="text-sm">Explore all available services:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm bg-card p-2 rounded border">
                              <strong>Nextcloud</strong><br />
                              Personal cloud storage
                            </div>
                            <div className="text-sm bg-card p-2 rounded border">
                              <strong>Radarr</strong><br />
                              Movie management
                            </div>
                          </div>
                          {!step.completed && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteStep(step.id)}
                              className="mt-2"
                            >
                              Explore Now
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <div className="text-xs text-muted-foreground">
            <p>More mobile client integrations coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
