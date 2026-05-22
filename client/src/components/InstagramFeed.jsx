import React from 'react';
import { Instagram, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const InstagramFeed = () => {
  const instagramUrl = "https://www.instagram.com/brahmanijewellers___?igsh=MTBpaW9kbWx2cTI0dg%3D%3D&utm_source=qr";

  const posts = [
    {
      id: 1,
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80",
      likes: "342",
      comments: "24",
      caption: "Timeless elegance in pure gold. ✨"
    },
    {
      id: 2,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
      likes: "512",
      comments: "45",
      caption: "Exquisite bridal sets hand-crafted for your special day. 👑"
    },
    {
      id: 3,
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
      likes: "289",
      comments: "12",
      caption: "Adorn yourself with pure gold rings. 💍"
    },
    {
      id: 4,
      imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80",
      likes: "601",
      comments: "58",
      caption: "Celebrate tradition with our classic royal bangles. 🌸"
    },
    {
      id: 5,
      imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80",
      likes: "418",
      comments: "30",
      caption: "Designs that inspire trust for 35+ years. 💛"
    },
    {
      id: 6,
      imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
      likes: "375",
      comments: "19",
      caption: "Add a touch of royalty with our premium collection. ✨"
    }
  ];

  return (
    <section className="py-10 md:py-12 bg-cream border-t border-ochre/15 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-2 text-ochre"
          >
            <Instagram size={20} />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Follow Us</span>
          </motion.div>
          
          <h2 className="text-4xl font-serif font-bold text-coffee mb-2">
            Instagram <span className="text-ochre">Showcase</span>
          </h2>
          <p className="text-coffee/70 text-sm">
            Stay updated with our latest collections and designs on Instagram
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post, idx) => (
            <motion.a
              key={post.id}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-xl overflow-hidden shadow-md group border border-ochre/10 hover:border-ochre/50 transition-colors duration-300"
            >
              {/* Image */}
              <img 
                src={post.imageUrl} 
                alt={post.caption} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-coffee/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center">
                <div className="flex gap-4 mb-2 text-white font-medium text-sm">
                  <span className="flex items-center gap-1">
                    <Heart size={16} className="fill-white text-white" /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={16} className="fill-white text-white" /> {post.comments}
                  </span>
                </div>
                <p className="text-[10px] text-cream/90 line-clamp-2 px-1 mb-3">{post.caption}</p>
                <Instagram size={24} className="text-ochre hover:scale-110 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-8 text-center">
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-coffee text-cream hover:bg-coffee/90 rounded-full font-bold uppercase tracking-widest text-xs border border-ochre/30 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Instagram size={16} />
            Follow @brahmanijewellers___
          </motion.a>
        </div>

      </div>
    </section>
  );
};

export default InstagramFeed;
