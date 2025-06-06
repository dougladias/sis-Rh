'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import dynamic from 'next/dynamic'
import { handleLogin } from '@/server/login/login.actions'

// Dynamically import Lottie with SSR disabled to avoid "document is not defined" error
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Array de símbolos de criptomoedas para usar no background
const cryptoSymbols = ['₿', 'Ξ', 'Ł', 'Ð', '₮', '₳', '◎', '₽', 'Ӿ', '₱', 'Ƀ'];

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    
    interface LottieAnimationData {
        v: string;
        fr: number;
        ip: number;
        op: number;
        w: number;
        h: number;
        nm: string;
        ddd: number;
        assets: Array<Record<string, unknown>>;
        layers: Array<Record<string, unknown>>;
        [key: string]: unknown;
    }

    const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null)
    const [isClient, setIsClient] = useState(false)
    // Estado para guardar os elementos de criptomoeda do background
    const [cryptoElements, setCryptoElements] = useState<React.ReactNode[]>([])

    // Set isClient to true on component mount
    useEffect(() => {
        setIsClient(true)
        
        // Gerar elementos de criptomoedas apenas no cliente
        if (typeof window !== 'undefined') {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Gerar um número aleatório de elementos de criptomoedas (entre 15 e 25)
            const numberOfElements = Math.floor(Math.random() * 10) + 15;
            const elements = [];
            
            for (let i = 0; i < numberOfElements; i++) {
                const randomSymbol = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
                const randomX = Math.random() * windowWidth;
                const randomY = Math.random() * windowHeight;
                const randomSize = Math.random() * 30 + 10; // Entre 10 e 40px
                const randomDuration = Math.random() * 20 + 10; // Entre 10 e 30 segundos
                const randomDelay = Math.random() * 5; // Entre 0 e 5 segundos
                const randomOpacity = Math.random() * 0.5 + 0.1; // Entre 0.1 e 0.6
                
                elements.push(
                    <motion.div
                        key={i}
                        className="absolute text-cyan-500 dark:text-cyan-400 pointer-events-none"
                        style={{
                            left: randomX,
                            top: randomY,
                            fontSize: `${randomSize}px`,
                            opacity: randomOpacity,
                        }}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ 
                            opacity: [randomOpacity, randomOpacity * 0.4, randomOpacity],
                            y: [0, -100, -200, -300, -400],
                            x: (i % 2 === 0) ? [0, 20, -20, 10, -10] : [0, -20, 20, -10, 10], // Movimento serpenteante
                            rotate: [0, 10, -10, 15, -15]
                        }}
                        transition={{ 
                            duration: randomDuration, 
                            repeat: Infinity, 
                            delay: randomDelay,
                            ease: "linear"
                        }}
                    >
                        {randomSymbol}
                    </motion.div>
                );
            }
            
            setCryptoElements(elements);
        }
    }, []);

    // Use fetch instead of import to load the animation data (only on client)
    useEffect(() => {
        if (isClient) {
            fetch('/logo-g.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch animation data');
                    }
                    return response.json();
                })
                .then(data => {
                    setAnimationData(data);
                })
                .catch(error => {
                    console.error("Error loading animation:", error);
                });
        }
    }, [isClient]);

    // Função modificada para usar o Server Action handleLogin
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // Criar um FormData para enviar ao server action
            const formData = new FormData()
            formData.append('email', email)
            formData.append('password', password)
            
            // Chamar o server action
            const result = await handleLogin(formData)
            
            if (result.error) {
                setError(result.error)
                setIsLoading(false)
            } else if (result.success) {
                // Redirecionar para o dashboard em caso de sucesso
                router.push('/pages/dashboard')
                router.refresh() // Atualiza a navegação para refletir o novo estado de autenticação
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error)
            setError('Ocorreu um erro ao tentar fazer login')
            setIsLoading(false)
        }
    }

    // Variants for container animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            }
        }
    }

    // Variants for child elements
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    }

    // Logo animation variants
    const logoVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                delay: 0.2
            }
        }
    }

    // Button hover animation
    const buttonVariants = {
        initial: { scale: 1 },
        hover: { scale: 1.03, transition: { duration: 0.2 } },
        tap: { scale: 0.97 }
    }

    // Error message animation
    const errorVariants = {
        hidden: { opacity: 0, y: -10, height: 0 },
        visible: {
            opacity: 1,
            y: 0,
            height: 'auto',
            transition: { type: 'spring', stiffness: 500, damping: 30 }
        },
        exit: {
            opacity: 0,
            y: -10,
            height: 0,
            transition: { duration: 0.2 }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-950 dark:to-stone-900 p-4">
            {/* Elementos do background de criptomoedas */}
            {cryptoElements}
            
            {/* Overlay gradiente para melhorar a legibilidade */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent to-stone-100/80 dark:to-stone-950/80"></div>
            
            {/* Partículas em movimento (como pequenos pontos de conexão) */}
            {isClient && Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full bg-cyan-500/30 dark:bg-cyan-400/20 pointer-events-none"
                    style={{
                        width: Math.random() * 6 + 2,
                        height: Math.random() * 6 + 2,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50],
                        y: [0, Math.random() * 100 - 50],
                        opacity: [0.1, 0.5, 0.1]
                    }}
                    transition={{
                        duration: Math.random() * 20 + 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
            ))}
            
            {/* Grid de fundo sutil para dar profundidade */}
            <div className="absolute inset-0 bg-center opacity-[0.02] dark:opacity-[0.05]"></div>
            
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md z-10"
            >
                <motion.div
                    variants={logoVariants}
                    className="flex justify-center mb-8"
                >
                    <div className="flex items-center justify-center">
                        {isClient && animationData ? (
                            <Lottie
                                animationData={animationData}
                                loop={true}
                                style={{ width: '150px', height: '150px' }}
                                className="shadow-lg rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md"
                            />
                        ) : (
                            // Fallback while animation loads
                            <motion.div
                                className="h-24 w-24 bg-cyan-600 rounded-full flex items-center justify-center"
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <span className="text-white text-2xl font-bold">G</span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="text-center mb-8"
                >
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Bem-vindo ao Sistema Globoo.</h1>
                    <p className="text-stone-600 dark:text-stone-300 mt-2">Faça login para acessar o painel</p>
                </motion.div>

                <Card className="shadow-xl border-none bg-white/80 backdrop-blur-md dark:bg-stone-800/80">
                    <CardContent className="pt-6">
                        <form onSubmit={onSubmit} className="space-y-5">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        variants={errorVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={itemVariants}>
                                <label htmlFor="email" className="block mb-2 font-medium text-stone-700 dark:text-stone-200">E-mail</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Mail className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                                    </div>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-stone-50 dark:bg-stone-700"
                                        placeholder=""
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label htmlFor="password" className="block mb-2 font-medium text-stone-700 dark:text-stone-200">Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Lock className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                                    </div>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 bg-stone-50 dark:bg-stone-700"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus:outline-none"
                                        >
                                            {showPassword ?
                                                <EyeOff className="w-5 h-5" /> :
                                                <Eye className="w-5 h-5" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex justify-end">
                                <a href="#" className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">
                                    Esqueceu a senha?
                                </a>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <motion.div
                                    variants={buttonVariants}
                                    initial="initial"
                                    whileHover="hover"
                                    whileTap="tap"
                                >
                                    <Button
                                        type="submit"
                                        className="w-full bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800 text-white py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                                />
                                                Autenticando...
                                            </>
                                        ) : (
                                            'Entrar'
                                        )}
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>

                <motion.p
                    variants={itemVariants}
                    className="text-center mt-6 text-stone-600 dark:text-stone-400 text-sm"
                >
                    © {new Date().getFullYear()} Globoo.io Todos os direitos reservados.
                </motion.p>
            </motion.div>
        </div>
    )
}