import React from 'react';
import { Gem, Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-cream border-t border-ochre/10 pt-20 pb-10 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <Gem className="text-ochre" size={32} />
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold tracking-widest text-coffee uppercase italic transition-colors duration-300">Brahmani</span>
                <span className="text-[10px] text-ochre/80 tracking-[0.3em] uppercase -mt-1">Jewellers</span>
              </div>
            </Link>
            <p className="text-coffee/80 text-sm leading-relaxed mb-6 italic transition-colors duration-300">
              "Elegance that defines you" - Celebrating over 25 years of excellence in jewellery design and trust.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/brahmanijewellers___?igsh=MTBpaW9kbWx2cTI0dg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="p-2 bg-cream-alt text-ochre rounded-full hover:bg-ochre hover:text-cream transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://www.facebook.com/share/1AzriEg5E1/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="p-2 bg-cream-alt text-ochre rounded-full hover:bg-ochre hover:text-cream transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-cream-alt text-ochre rounded-full hover:bg-ochre hover:text-cream transition-all">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-ochre font-serif text-lg mb-6 uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-3 text-sm text-coffee/80 transition-colors duration-300">
              <li><Link to="/" className="hover:text-ochre transition-colors">Home</Link></li>
              <li><Link to="/gallery" className="hover:text-ochre transition-colors">Design Collection</Link></li>
              <li><Link to="/#about" className="hover:text-ochre transition-colors">Our Heritage</Link></li>
              <li><Link to="/#contact" className="hover:text-ochre transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-ochre font-serif text-lg mb-6 uppercase tracking-widest">Collections</h4>
            <ul className="space-y-3 text-sm text-coffee/80 transition-colors duration-300">
              <li><Link to="/gallery" className="hover:text-ochre transition-colors">Authentic Gold</Link></li>
              <li><Link to="/gallery" className="hover:text-ochre transition-colors">Designer Silver</Link></li>
              <li><Link to="/gallery" className="hover:text-ochre transition-colors">Bridal Collection</Link></li>
              <li><Link to="/gallery" className="hover:text-ochre transition-colors">Daily Wear</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-ochre font-serif text-lg mb-6 uppercase tracking-widest">Subscribe</h4>
            <p className="text-xs text-coffee/60 mb-4 uppercase tracking-widest italic transition-colors duration-300">Join our VIP list for exclusive previews</p>
            <div className="flex bg-cream-alt border border-ochre/20 p-1 rounded-sm transition-colors duration-300">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent border-none focus:outline-none text-coffee text-xs w-full px-2 placeholder:text-coffee/40"
              />
              <button className="bg-ochre text-cream p-2 rounded-sm text-xs font-bold transition-all hover:bg-coffee">
                <Mail size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-ochre/10 text-center transition-colors duration-300">
          <p className="text-[10px] text-coffee/60 uppercase tracking-[0.3em] transition-colors duration-300">
            &copy; {new Date().getFullYear()} Brahmani Jewellers. All Rights Reserved. Designed for Luxury.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
