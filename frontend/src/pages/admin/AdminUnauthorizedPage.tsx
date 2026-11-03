import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AdminUnauthorizedPage: React.FC = () => {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-rose-soft text-burgundy flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="label-editorial text-burgundy mb-2">Accès Restreint</span>
      <h2 className="text-2xl font-serif text-charcoal mb-3">Privilèges Insuffisants</h2>
      <p className="text-sm font-sans text-charcoal/70 mb-8 leading-relaxed">
        Cette section requiert les prérogatives d'administrateur principal. Votre profil opérateur (Staff) ne dispose pas des droits nécessaires.
      </p>
      <Link to="/admin">
        <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Retour au tableau de bord
        </Button>
      </Link>
    </div>
  );
};
