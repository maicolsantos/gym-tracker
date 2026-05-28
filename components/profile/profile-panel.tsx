"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FriendCodeDisplay } from "@/components/friend-code-display"
import { BadgeGrid } from "@/components/badges/badge-grid"
import type { UserProfile } from "@/lib/friends"
import type { User } from "firebase/auth"

interface ProfilePanelProps {
  user: User
  profile: UserProfile
}

export function ProfilePanel({ user, profile }: ProfilePanelProps) {
  const initials =
    user.displayName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "?"

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL ?? ""} referrerPolicy="no-referrer" />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-lg font-semibold">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <FriendCodeDisplay code={profile.friendCode} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeGrid uid={profile.uid} />
        </CardContent>
      </Card>
    </div>
  )
}
