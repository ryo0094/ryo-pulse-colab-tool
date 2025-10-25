import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { supabase } from "@/react-app/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { MessageCircle, Zap, Users, Shield } from "lucide-react";
import LanguageToggle from "@/react-app/components/LanguageToggle";

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/chat'
      }
    });
  };

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageToggle />
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
            {t('app.name')}
          </h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.features.messaging.title')}</h3>
            <p className="text-indigo-200">{t('landing.features.messaging.description')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.features.fast.title')}</h3>
            <p className="text-indigo-200">{t('landing.features.fast.description')}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('landing.features.collaboration.title')}</h3>
            <p className="text-indigo-200">{t('landing.features.collaboration.description')}</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/20 max-w-2xl mx-auto">
            <Shield className="w-16 h-16 text-white mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold text-white mb-4">{t('landing.cta.title')}</h2>
            <p className="text-indigo-200 mb-8 text-lg">
              {t('landing.cta.description')}
            </p>
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('auth.continueWithGoogle')}
            </button>
            <p className="text-sm text-indigo-300 mt-4">
              {t('auth.secureAuth')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
