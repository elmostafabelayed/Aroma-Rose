import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container-editorial py-24 sm:py-36 flex flex-col items-center justify-center text-center">
      <span className="label-editorial text-burgundy mb-3">Erreur 404</span>
      <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mb-4">
        Page Introuvable
      </h1>
      <p className="text-base text-charcoal/70 max-w-md mb-8 font-sans leading-relaxed">
        Le rituel ou la page que vous recherchez n’existe pas ou a été déplacé dans nos archives botaniques.
      </p>
      <Link to="/">
        <Button size="lg" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Retourner à l’accueil
        </Button>
      </Link>
    </div>
  );
};

