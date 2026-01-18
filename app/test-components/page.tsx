'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';

export default function TestComponentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Red Clay Tennis - Component Test Page
          </h1>
          <p className="text-muted-foreground">
            Testing all shadcn/ui components with the Red Clay Tennis theme
          </p>
        </div>

        <Separator />

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Primary terra cotta red buttons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards & Badges */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Court Booking</CardTitle>
                <Badge>Available</Badge>
              </div>
              <CardDescription>Tennis Court #1</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Premium clay court with lighting. Next available: Today at 2:00 PM
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <span className="text-sm font-semibold">$40/hour</span>
              <Button>Book Now</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status indicators</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Cancelled</Badge>
              <Badge className="bg-success text-white">Confirmed</Badge>
              <Badge className="bg-warning text-white">Pending</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Avatar & User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar Component</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">RC</AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>

        {/* Modals */}
        <Card>
          <CardHeader>
            <CardTitle>Modals</CardTitle>
            <CardDescription>Dialog and Sheet (Bottom Sheet)</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Court</DialogTitle>
                  <DialogDescription>
                    Select your preferred date and time for tennis court booking.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="court">Court</Label>
                    <Select>
                      <SelectTrigger id="court">
                        <SelectValue placeholder="Select court" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="court1">Tennis Court #1</SelectItem>
                        <SelectItem value="court2">Tennis Court #2</SelectItem>
                        <SelectItem value="pickleball">Pickleball Court</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Confirm Booking</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Bottom Sheet</Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Quick Book</SheetTitle>
                  <SheetDescription>
                    Mobile-first booking experience with bottom sheet
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </div>
                  <Button className="w-full">Continue</Button>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sport">Sport Type</Label>
              <Select>
                <SelectTrigger id="sport">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs Component</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                <p className="text-sm text-muted-foreground">Your upcoming bookings will appear here.</p>
              </TabsContent>
              <TabsContent value="pending">
                <p className="text-sm text-muted-foreground">Bookings awaiting approval will appear here.</p>
              </TabsContent>
              <TabsContent value="past">
                <p className="text-sm text-muted-foreground">Your past bookings history.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Skeleton components for loading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>

        {/* Toast */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => toast.success('Booking confirmed successfully!')}
            >
              Success Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error('Failed to book court')}
            >
              Error Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast('Booking pending approval')}
            >
              Info Toast
            </Button>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar Component</CardTitle>
            <CardDescription>Date picker for bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Color Palette Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Red Clay Tennis brand colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-primary" />
                <p className="text-xs font-medium">Primary (Terra Cotta)</p>
                <p className="text-xs text-muted-foreground">#C44536</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-success" />
                <p className="text-xs font-medium">Success</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-warning" />
                <p className="text-xs font-medium">Warning</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-md bg-destructive" />
                <p className="text-xs font-medium">Error</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
