import os
import math
from PIL import Image, ImageDraw

def draw_logo():
    # Create a high-res RGBA image with transparent background (500x500)
    size = 500
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    
    # Premium metallic gold color palette matching Brahmani Jewellers (#d4af37 and #EBA938)
    gold_color = (235, 169, 56, 255) # Primary elegant gold
    
    # 1. Draw Outer Circle Ring (r = 220)
    draw.ellipse([center - 220, center - 220, center + 220, center + 220], outline=gold_color, width=12)
    
    # 2. Draw Second concentric outer circle (r = 195)
    draw.ellipse([center - 195, center - 195, center + 195, center + 195], outline=gold_color, width=6)
    
    # 3. Draw Center Ring (r = 75)
    draw.ellipse([center - 75, center - 75, center + 75, center + 75], outline=gold_color, width=8)
    
    # 4. Draw 16 Spokes
    # Separated by 22.5 degrees (360 / 16)
    num_spokes = 16
    for i in range(num_spokes):
        angle_deg = i * (360.0 / num_spokes)
        angle_rad = math.radians(angle_deg)
        
        # Calculate start point (on the center ring, r=75)
        x_start = center + 75 * math.cos(angle_rad)
        y_start = center + 75 * math.sin(angle_rad)
        
        # Calculate end point (on the inner ring of outer circle, r=195)
        x_end = center + 195 * math.cos(angle_rad)
        y_end = center + 195 * math.sin(angle_rad)
        
        # Draw a beautiful spoke line
        draw.line([x_start, y_start, x_end, y_end], fill=gold_color, width=15)
        
    # 5. Draw the stylized "bj" monogram inside the center circle (r=75)
    # The logo has a calligraphic monogram representing "bj":
    # Let's draw two elegant vertical/curved strokes that look exactly like the calligraphy:
    
    # Left stroke of b (elegant vertical line curving at the top and bottom)
    draw.line([center - 18, center - 35, center - 18, center + 15], fill=gold_color, width=10, joint="round")
    draw.ellipse([center - 23, center - 45, center - 13, center - 35], fill=gold_color) # Top dot
    draw.arc([center - 28, center - 5, center - 8, center + 15], start=0, end=180, fill=gold_color, width=10) # bottom curve
    
    # Right stroke of j (with top and bottom dots, curving elegantly)
    draw.line([center + 18, center - 20, center + 18, center + 30], fill=gold_color, width=10, joint="round")
    draw.ellipse([center + 13, center - 35, center + 23, center - 25], fill=gold_color) # Top dot of j
    draw.ellipse([center + 13, center + 35, center + 23, center + 45], fill=gold_color) # Bottom dot of j
    
    # Resize the image with high-quality resampling to 150x150 pixels
    img_resized = img.resize((150, 150), Image.Resampling.LANCZOS)
    
    # Save the output file to public directory
    output_path = r"c:\Users\aksha\OneDrive\Desktop\trial\brahmani-jewellers\client\public\logo.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img_resized.save(output_path, "PNG")
    print(f"Logo successfully drawn and saved to {output_path}")
    
    # Save to mobile assets
    mobile_output_path = r"c:\Users\aksha\OneDrive\Desktop\trial\brahmani-jewellers\mobile\assets\images\logo.png"
    if os.path.exists(os.path.dirname(mobile_output_path)):
        img_resized.save(mobile_output_path, "PNG")
        print(f"Saved to mobile assets: {mobile_output_path}")

if __name__ == "__main__":
    draw_logo()
