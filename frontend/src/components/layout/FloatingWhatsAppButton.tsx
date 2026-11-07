import React from 'react';
import { OFFICIAL_CONTACT_LINKS } from '../../constants/contact';

/**
 * FloatingWhatsAppButton - Luxury Floating WhatsApp Contact Widget
 *
 * Fixed to the bottom-right viewport across storefront pages.
 * Uses authoritative WhatsApp destination provided by Aroma Rose.
 * Non-blocking wrapper ensures zero interference with cart, checkout, or mobile nav.
 */
export const FloatingWhatsAppButton: React.FC = () => {
  return (
    <aside
      aria-label="Assistance WhatsApp"
      className="pointer-events-none fixed bottom-5 right-5 z-30 sm:bottom-8 sm:right-8"
    >
      <a
        href={OFFICIAL_CONTACT_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactez-nous sur WhatsApp"
        title="Contactez-nous sur WhatsApp"
        className="pointer-events-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-[#25D366]/35 hover:scale-105 active:scale-95 transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 group"
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          className="transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          <path d="M17.507 14.307l-.009.075c-.238-.12-1.406-.694-1.624-.774-.219-.079-.378-.12-.538.12-.16.239-.617.774-.756.934-.14.16-.279.18-.518.06-.239-.12-1.01-.372-1.925-1.188-.712-.635-1.193-1.42-1.332-1.66-.14-.239-.015-.368.105-.487.108-.107.239-.279.359-.419.119-.14.159-.239.239-.398.079-.16.04-.299-.02-.419-.06-.12-.538-1.295-.737-1.774-.194-.467-.393-.404-.538-.412l-.46-.008c-.16 0-.419.06-.638.299-.219.24-.837.818-.837 1.994 0 1.176.857 2.311.977 2.471.12.16 1.688 2.578 4.09 3.614.572.247 1.018.394 1.366.505.574.183 1.097.157 1.51.095.46-.07 1.406-.575 1.605-1.13.199-.556.199-1.033.14-1.13-.06-.098-.219-.158-.458-.278z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.403C8.423 21.492 10.15 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.63 0-3.14-.492-4.402-1.337l-.315-.21-2.955.833.805-2.88-.228-.328C3.992 15.02 3.818 13.548 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.511 0 8.182 3.67 8.182 8.182 0 4.512-3.671 8.182-8.182 8.182z" />
        </svg>

        {/* Desktop contextual hover tooltip */}
        <span className="hidden lg:group-hover:inline-block absolute right-full mr-3 px-3 py-1.5 bg-charcoal text-white text-xs font-sans rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Contactez-nous sur WhatsApp
        </span>
      </a>
    </aside>
  );
};
