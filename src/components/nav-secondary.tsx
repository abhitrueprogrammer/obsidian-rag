"use client"

import * as React from "react"
import { useContext } from "react"
import { SunIcon, MoonIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeContext } from "@/contexts/theme-context"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8"
              title={item.title}
            >
              <a href={item.url}>
                {item.icon}
              </a>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
