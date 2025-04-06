import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import { supabase, signInWithGoogle as supabaseSignInWithGoogle, signOut, getCurrentUser } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Carregar usuário do Supabase Auth ao inicializar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabaseUser = await getCurrentUser();
        
        if (supabaseUser) {
          const user = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || 'Usuário',
            email: supabaseUser.email || ''
          };
          setUser(user);
          console.log('Usuário carregado do Supabase Auth:', user);
        } else {
          // Fallback para localStorage para compatibilidade com versões anteriores
          const storedUser = localStorage.getItem('pauloCell_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.log('Usuário carregado do localStorage (legado):', parsedUser);
            } catch (error) {
              console.error('Erro ao analisar o usuário armazenado:', error);
              localStorage.removeItem('pauloCell_user');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    
    // Configurar evento de alteração de auth do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Evento Auth Supabase: ${event}`);
        if (event === 'SIGNED_IN' && session?.user) {
          const supabaseUser = session.user;
          const user = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || 'Usuário',
            email: supabaseUser.email || ''
          };
          setUser(user);
          localStorage.setItem('pauloCell_user', JSON.stringify(user));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('pauloCell_user');
        }
      }
    );
    
    loadUser();
    
    // Limpar listener quando componente é desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Usar Supabase para login com email/senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data?.user) {
        const user = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || 'Usuário',
          email: data.user.email || ''
        };
        setUser(user);
        localStorage.setItem('pauloCell_user', JSON.stringify(user));
        
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao sistema Paulo Cell.'
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      // Fallback para autenticação local (para compatibilidade durante transição)
      if ((email === 'paullo.celullar2020@gmail.com' || email === 'paulocell') && password === 'paulocell@admin') {
        const user = {
          id: '1',
          name: 'Paulo Cell Admin',
          email: email === 'paulocell' ? 'paullo.celullar2020@gmail.com' : email
        };
        setUser(user);
        localStorage.setItem('pauloCell_user', JSON.stringify(user));
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao sistema Paulo Cell.'
        });
        navigate('/dashboard');
        return;
      }
      
      console.error('Erro de login:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao fazer login.'
      });
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Limpar mensagens de erro anteriores
      const errorElement = document.getElementById('google-login-error');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }

      console.log('Iniciando login com Google (Supabase)...');
      const { data, error } = await supabaseSignInWithGoogle();
      
      if (error) throw error;
      
      console.log('Login com Google iniciado:', data);
      
      // O redirecionamento acontecerá automaticamente
      // O usuário será processado pelo listener do onAuthStateChange quando retornar
      
    } catch (error) {
      console.error('Erro no login com Google:', error);
      
      let errorMessage = 'Ocorreu um erro ao fazer login com Google.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login com Google',
        description: errorMessage
      });
      
      // Exibir mensagem de erro na UI
      const errorElement = document.getElementById('google-login-error');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Usar Supabase para registro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.user) {
        const user = {
          id: data.user.id,
          name,
          email
        };
        setUser(user);
        localStorage.setItem('pauloCell_user', JSON.stringify(user));
        
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Bem-vindo ao sistema Paulo Cell.'
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer cadastro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao fazer cadastro.'
      });
    }
  };

  const logout = async () => {
    try {
      // Fazer logout do Supabase
      const { error } = await signOut();
      if (error) throw error;
      
      setUser(null);
      localStorage.removeItem('pauloCell_user');
      
      toast({
        title: 'Logout realizado com sucesso!',
        description: 'Até logo!'
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Fazer logout local mesmo se o Supabase falhar
      setUser(null);
      localStorage.removeItem('pauloCell_user');
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
