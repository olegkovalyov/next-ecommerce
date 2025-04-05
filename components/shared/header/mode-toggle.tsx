'use client';
import {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {useTheme} from 'next-themes';
import {SunIcon, MoonIcon, SunMoon} from 'lucide-react';
import { ReactElement } from 'react';

const ModeToggle = (): ReactElement | null => {
  const [mounted, setMounted] = useState(false);
  const {theme, setTheme} = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
        >
          {theme === 'system' ? (
            <SunMoon/>
          ) : theme === 'dark' ? (
            <MoonIcon/>
          ) : (
            <SunIcon/>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="cursor-pointer">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={theme === 'system'}
          onClick={() => setTheme('system')}
        >
          System
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={theme === 'dark'}
          onClick={() => setTheme('dark')}
        >
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          Light
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeToggle;
