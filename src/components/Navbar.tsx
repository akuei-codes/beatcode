import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-icon-black/90 backdrop-blur-md border-b border-icon-gray/20' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center">
              <span className="text-icon-accent text-2xl font-bold tracking-tight">ICON</span>
              <span className="ml-2 bg-icon-accent text-xs rounded px-1.5 py-0.5 text-icon-black font-medium">BETA</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className={`text-sm ${location.pathname === '/' ? 'text-icon-accent' : 'text-icon-white'} hover:text-icon-accent`}
              onClick={() => navigate('/')}
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              className={`text-sm ${location.pathname === '/create-battle' ? 'text-icon-accent' : 'text-icon-white'} hover:text-icon-accent`}
              onClick={() => navigate('/create-battle')}
            >
              Create Battle
            </Button>
            <Button 
              variant="ghost" 
              className={`text-sm ${location.pathname === '/join-battle' ? 'text-icon-accent' : 'text-icon-white'} hover:text-icon-accent`}
              onClick={() => navigate('/join-battle')}
            >
              Join Battle
            </Button>
            
            <div className="ml-4 flex items-center space-x-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-icon-accent">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                        <AvatarFallback className="bg-icon-dark-gray text-icon-accent">
                          {profile?.username?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    className="border border-icon-gray hover:bg-icon-gray/30"
                    onClick={() => navigate('/login')}
                  >
                    Log In
                  </Button>
                  <Button
                    className="bg-icon-accent hover:brightness-110 text-icon-black"
                    onClick={() => navigate('/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-icon-dark-gray border-t border-icon-gray/20 animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${location.pathname === '/' ? 'text-icon-accent' : 'text-icon-white'}`}
              onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${location.pathname === '/create-battle' ? 'text-icon-accent' : 'text-icon-white'}`}
              onClick={() => { navigate('/create-battle'); setIsMobileMenuOpen(false); }}
            >
              Create Battle
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start ${location.pathname === '/join-battle' ? 'text-icon-accent' : 'text-icon-white'}`}
              onClick={() => { navigate('/join-battle'); setIsMobileMenuOpen(false); }}
            >
              Join Battle
            </Button>
            
            <div className="pt-4 pb-2 border-t border-icon-gray/30">
              {user ? (
                <>
                  <div className="flex items-center px-2 py-3">
                    <Avatar className="h-10 w-10 border-2 border-icon-accent mr-3">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                      <AvatarFallback className="bg-icon-dark-gray text-icon-accent">
                        {profile?.username?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{profile?.username}</p>
                      <p className="text-xs text-gray-400">{profile?.email}</p>
                      <p className="text-xs text-icon-accent">Rating: {profile?.rating}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  >
                    Log In
                  </Button>
                  <Button
                    className="w-full bg-icon-accent text-icon-black"
                    onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
