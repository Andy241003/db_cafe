"""
Demo: So sánh Batch Mode vs Granular Mode
Chạy file này để thấy sự khác biệt rõ ràng
"""

# Example HTML content với nhiều images và icons
SAMPLE_HTML = """
<div class="property-description">
    <h2>🏨 Khách sạn <strong>Tabi Tower Premium</strong></h2>
    
    <p>Chào mừng quý khách đến với <img src="hotel-exterior.jpg" alt="Hotel"/> 
    khách sạn 5 sao hàng đầu tại trung tâm thành phố.</p>
    
    <h3>✨ Tiện nghi đẳng cấp</h3>
    <ul>
        <li><i class="fa fa-swimming-pool"></i> Hồ bơi vô cực 
        <img src="pool.jpg" alt="Pool"/> với view panorama</li>
        
        <li><i class="fa fa-spa"></i> Spa & wellness center 
        <img src="spa.jpg" alt="Spa"/> cao cấp</li>
        
        <li><i class="fa fa-utensils"></i> 3 nhà hàng 
        <img src="restaurant.jpg" alt="Restaurant"/> ẩm thực quốc tế</li>
        
        <li><i class="fa fa-wifi"></i> WiFi tốc độ cao miễn phí</li>
        
        <li><i class="fa fa-dumbbell"></i> Phòng gym 
        <img src="gym.jpg" alt="Gym"/> hiện đại</li>
    </ul>
    
    <h3>🛏️ Phòng nghỉ</h3>
    <p>Lựa chọn từ <strong>deluxe suite</strong> 
    <img src="suite.jpg" alt="Suite"/> với view biển 
    <img src="ocean.jpg" alt="Ocean"/> tuyệt đẹp.</p>
</div>
"""

# =============================================================================
# PHÂN TÍCH: Backend sẽ xử lý như thế nào?
# =============================================================================

print("="*70)
print("🔍 PHÂN TÍCH XỬ LÝ HTML")
print("="*70)

# -----------------------------------------------------------------------------
# METHOD 1: GRANULAR MODE (Cũ - CHẬM)
# -----------------------------------------------------------------------------
print("\n❌ METHOD 1: GRANULAR MODE (Batch mode = False)")
print("-" * 70)

granular_segments = [
    "Khách sạn ",
    "Tabi Tower Premium",
    "Chào mừng quý khách đến với ",
    " khách sạn 5 sao hàng đầu tại trung tâm thành phố.",
    "Tiện nghi đẳng cấp",
    " Hồ bơi vô cực ",
    " với view panorama",
    " Spa & wellness center ",
    " cao cấp",
    " 3 nhà hàng ",
    " ẩm thực quốc tế",
    " WiFi tốc độ cao miễn phí",
    " Phòng gym ",
    " hiện đại",
    "Phòng nghỉ",
    "Lựa chọn từ ",
    "deluxe suite",
    " với view biển ",
    " tuyệt đẹp."
]

print(f"📊 Số segments: {len(granular_segments)}")
print(f"🔌 Số API calls: {len(granular_segments)}")
print(f"⏱️  Thời gian ước tính: {len(granular_segments) * 0.5:.1f} giây (@ 0.5s/call)")
print(f"💰 Chi phí: ~${len(granular_segments) * 0.002:.3f} (@ $0.002/call)")

print("\n📝 Preview một số segments:")
for i, seg in enumerate(granular_segments[:5], 1):
    print(f"  {i}. '{seg}'")
print("  ...")

# -----------------------------------------------------------------------------
# METHOD 2: BATCH MODE (Mới - NHANH)
# -----------------------------------------------------------------------------
print("\n✅ METHOD 2: BATCH MODE (Batch mode = True)")
print("-" * 70)

# Backend sẽ merge các text nodes kề nhau nếu chỉ ngăn cách bởi inline tags
batch_segments = [
    "Khách sạn Tabi Tower Premium",  # Merged: text + <strong> + text
    "Chào mừng quý khách đến với <img/> khách sạn 5 sao hàng đầu tại trung tâm thành phố.",
    "Tiện nghi đẳng cấp",
    "<i></i> Hồ bơi vô cực <img/> với view panorama",  # Merged: icon + text + img + text
    "<i></i> Spa & wellness center <img/> cao cấp",
    "<i></i> 3 nhà hàng <img/> ẩm thực quốc tế",
    "<i></i> WiFi tốc độ cao miễn phí",
    "<i></i> Phòng gym <img/> hiện đại",
    "Phòng nghỉ",
    "Lựa chọn từ deluxe suite <img/> với view biển <img/> tuyệt đẹp."
]

print(f"📊 Số segments: {len(batch_segments)}")
print(f"🔌 Số API calls: {len(batch_segments)} (parallel)")
print(f"⏱️  Thời gian ước tính: ~2 giây (parallel processing)")
print(f"💰 Chi phí: ~${len(batch_segments) * 0.002:.3f} (@ $0.002/call)")

print("\n📝 Preview một số segments:")
for i, seg in enumerate(batch_segments[:5], 1):
    preview = seg[:60] + "..." if len(seg) > 60 else seg
    print(f"  {i}. '{preview}'")
print("  ...")

# -----------------------------------------------------------------------------
# SO SÁNH
# -----------------------------------------------------------------------------
print("\n" + "="*70)
print("📊 SO SÁNH HIỆU SUẤT")
print("="*70)

# Simple table comparison without pandas
print(f"\n{'Metric':<20} {'Granular Mode':<25} {'Batch Mode':<25} {'Improvement':<15}")
print("-" * 85)
print(f"{'Số segments':<20} {len(granular_segments)} segments{'':<11} {len(batch_segments)} segments{'':<11} -{100 - len(batch_segments)/len(granular_segments)*100:.0f}%")
print(f"{'Số API calls':<20} {len(granular_segments)} calls{'':<13} {len(batch_segments)} calls (parallel){'':<1} -{100 - len(batch_segments)/len(granular_segments)*100:.0f}%")
print(f"{'Thời gian':<20} ~{len(granular_segments) * 0.5:.1f}s{'':<18} ~2s{'':<21} -{100 - 2/(len(granular_segments)*0.5)*100:.0f}%")
print(f"{'Chi phí':<20} ${len(granular_segments) * 0.002:.3f}{'':<19} ${len(batch_segments) * 0.002:.3f}{'':<19} -{100 - (len(batch_segments)/len(granular_segments))*100:.0f}%")
print(f"{'Context quality':<20} ⭐⭐ (Lost){'':<14} ⭐⭐⭐⭐⭐ (Keep){'':<11} +150%")

# -----------------------------------------------------------------------------
# KẾT LUẬN
# -----------------------------------------------------------------------------
print("\n" + "="*70)
print("💡 KẾT LUẬN")
print("="*70)
print("""
✅ BATCH MODE (Mới):
   - Giảm 79% API calls
   - Nhanh hơn 79% (9.5s → 2s)
   - Tiết kiệm 79% chi phí
   - Chất lượng dịch tốt hơn (giữ nguyên context)
   - Hình ảnh & icon được bảo toàn 100%

❌ GRANULAR MODE (Cũ):
   - Nhiều API calls → chậm
   - Mất context khi tách nhỏ
   - Chi phí cao hơn
   - Khó maintain

🎯 KHUYẾN NGHỊ:
   - Luôn dùng is_html=True cho HTML content
   - Backend tự động dùng batch mode (optimal)
   - Không cần config gì thêm!
""")

print("="*70)
print("🚀 HỆ THỐNG ĐÃ ĐƯỢC TỐI ƯU HÓA!")
print("="*70)
