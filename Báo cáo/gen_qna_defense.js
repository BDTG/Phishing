const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

const TNR = "Times New Roman";

function mainTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: 32, bold: true, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 360 },
  });
}

function sectionTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: 32, bold: true, color: "000080" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 240, line: 360 },
  });
}

function speechHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, font: TNR, size: 28, bold: true, color: "006400" })], 
    spacing: { before: 240, after: 120, line: 360 },
  });
}

function speechBody(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, font: TNR, size: 28, italics: false, color: "222222" })], 
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
  });
}

function actionNote(text) {
  return new Paragraph({
    children: [new TextRun({ text: `(Hành động: ${text})`, font: TNR, size: 24, bold: true, italics: true, color: "FF8C00" })], 
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
  });
}

function question(qText) {
  return new Paragraph({
    children: [new TextRun({ text: `Câu hỏi: ${qText}`, font: TNR, size: 28, bold: true, color: "C00000" })], 
    spacing: { before: 240, after: 80, line: 360 },
    indent: { left: 0 },
  });
}

function answer(aText) {
  return new Paragraph({
    children: [new TextRun({ text: "Trả lời: ", font: TNR, size: 26, bold: true, color: "20208B" }), new TextRun({ text: aText, font: TNR, size: 26 })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 120, line: 360 },
    indent: { left: 360 },
  });
}

const children = [
  mainTitle("KỊCH BẢN THUYẾT TRÌNH VÀ BẢO VỆ ĐỒ ÁN"),
  new Paragraph({ spacing: { after: 240 } }),

  sectionTitle("PHẦN 1: KỊCH BẢN THUYẾT TRÌNH (ĐỌC TỪ ĐẦU ĐẾN CUỐI)"),
  
  actionNote("Mở đầu - Chào hỏi và giới thiệu"),
  speechBody("Dạ, em xin chào quý thầy cô trong Hội đồng. Em là Trần Duy Thái, sinh viên thực hiện đồ án. Hôm nay em xin phép được trình bày về đề tài: 'Xây dựng hệ thống phát hiện URL lừa đảo (Phishing) theo thời gian thực sử dụng Machine Learning và Chrome Extension'."),
  
  actionNote("Chuyển slide: Mục 1, 2 & 3 - Mục tiêu, Phạm vi và Đối tượng"),
  speechHeading("1. Về mục tiêu, phạm vi và giá trị ứng dụng:"),
  speechBody("Mục tiêu tổng quát của đề tài là xây dựng một hệ thống bảo vệ người dùng trước các cuộc tấn công lừa đảo thông qua URL bằng cách kết hợp học máy và phân tích nội dung thời gian thực. Em đặt mục tiêu phát hiện lừa đảo với độ chính xác trên 99% bằng mô hình XGBoost, triển khai dưới dạng Chrome Extension hoạt động hoàn toàn offline để bảo vệ quyền riêng tư, và xây dựng kiến trúc phòng thủ đa tầng để giảm thiểu tối đa tỉ lệ báo động giả (False Positive)."),
  speechBody("Về phạm vi, hệ thống được triển khai trên Google Chrome theo chuẩn Manifest V3 để đảm bảo hiệu suất cao và bảo mật tốt. Phạm vi nghiên cứu tập trung vào phân tích ngữ vựng URL (39 đặc trưng) và cấu trúc DOM trang web. Việc xử lý đủ nhẹ để chạy offline giúp can thiệp và chặn đứng tấn công ngay tại thời điểm người dùng truy cập."),
  speechBody("Đối tượng phục vụ là người dùng internet phổ thông trong bối cảnh bùng nổ các trang web giả mạo. Giá trị ứng dụng mang lại là khả năng cảnh báo tức thì bằng trực quan như Banner, Icon hay Popup hoạt động nhẹ nhàng và hoàn toàn offline."),

  actionNote("Chuyển slide: Mục 4 - Mô hình kiến trúc"),
  speechHeading("2. Về kiến trúc hệ thống (Pipeline 8 lớp):"),
  speechBody("Hệ thống được thiết kế theo kiến trúc phòng thủ 8 lớp (Defense in Depth), kết hợp giữa danh sách tin cậy, quy tắc chuyên gia và học máy."),
  speechBody("Cụ thể, Lớp 0 đến 2 là lọc nhanh, giúp giải mã URL đa vòng, nhận diện IP nội bộ và tra cứu Whitelist Tranco 30K cũng như Blacklist. Lớp 3 và 4 là Heuristic, sử dụng thuật toán Levenshtein phát hiện Typosquatting và Soft Penalty cho các TLD đáng ngờ. TLD là phần đuôi URL, ví dụ kẻ tấn công thường dùng TLD giá rẻ như .xyz hay .tk để ẩn danh."),
  speechBody("Lớp 5 là Core Engine: Mô hình XGBoost phân tích 39 đặc trưng ngữ vựng để tính toán xác suất lừa đảo. Cuối cùng, Lớp 6 và 7 là Hậu xử lý: Phân tích DOM (Harmless Check) và tuổi domain (RDAP) để hiệu chỉnh điểm số AI."),

  actionNote("Chuyển slide: Mục 5 - Các bước triển khai"),
  speechHeading("3. Về các bước triển khai đã thực hiện:"),
  speechBody("Em đã thực hiện theo 5 bước tuần tự. Bước 1 là Thu thập dữ liệu: Chạy script 01_collect_data.py tải phishtank_raw.csv và tranco_raw.csv, gộp thành combined_dataset.csv. Sau đó dùng script 01a_augment_brand_data.py trộn thương hiệu, keyword và TLD rác để Tăng cường dữ liệu (Data Augmentation), giúp model nhận diện trang lừa đảo mới (zero-day). Cuối cùng là Chuẩn hóa qua 4 bước: Làm sạch, Xử lý mất cân bằng (dùng SMOTE tạo mẫu giả và Undersampling cắt bớt mẫu thực để đưa về tỷ lệ 1:1), và Scaling."),
  speechBody("Bước 2 là Trích xuất đặc trưng: Chạy script 02_feature_extraction_v3.py để biến URL thành 39 con số đặc trưng. Hai thuật toán quan trọng nhất là Entropy đo độ nhiễu URL (ví dụ vietcombank.com.vn có độ nhiễu thấp hơn hẳn loginupdate.b2x9z.xyz) và Levenshtein để so sánh URL cố tình viết sai chính tả so với URL gốc."),
  speechBody("Bước 3 là Huấn luyện model: Chạy script 03_train_model_v4.py để huấn luyện XGBoost, tối ưu siêu tham số và xuất ra file JSON triển khai nhẹ trên trình duyệt. Bước 4 là Danh sách trắng: Chạy script 04_prepare_tranco_top30k.py nén 30.000 tên miền uy tín giúp phản hồi tức thì không cần hỏi model. Và Bước 5 là Phát triển Extension bằng Javascript với các file xgboost_predictor.js để suy luận và content_analyzer.js để check harmless page."),

  actionNote("Chuyển slide: Mục 6 & 7 - Kết quả và Khó khăn"),
  speechHeading("4. Về kết quả đạt được và khó khăn đã gặp:"),
  speechBody("Về kết quả, mô hình XGBoost đạt F1-Score 0.9952 trên tập kiểm thử. F1-Score là trung bình điều hòa giữa Precision và Recall, là chỉ số khắt khe buộc mô hình tối ưu cả việc bắt đúng và không bỏ lọt nghi phạm. Extension cũng đã vượt qua bài kiểm thử 105 URL thực tế với tỷ lệ chính xác 100%, độ trễ dưới 5ms."),
  speechBody("Trong quá trình làm, em gặp Khó khăn 1 là báo động nhầm cao trên một số trang giải trí trung quốc do URL chứa ký tự nằm trong blacklist, kể cả thương hiệu như google.com đôi khi cũng bị flag mất an toàn. Xử lý bằng cách triển khai Layer 6 (Harmless Page Check), nếu trang không có form/input thì giảm 70% rủi ro. Khó khăn 2 là lỗi kết nối RDAP khi check tuổi domain quốc tế, em đã xử lý bằng cách sửa API RDAP, thêm Timeout 10s và Reputation Bonus để cộng điểm cho các TLD uy tín như .vn, .eu, .ru."),

  actionNote("Chuyển slide: Mục 8 - Phần đã hoàn thành và Kế hoạch"),
  speechHeading("5. Kết luận và Kế hoạch tiếp theo:"),
  speechBody("Đến nay, em đã hoàn thành Nhân dự đoán ML (39 features), 8 lớp phòng thủ, Giao diện và Hệ thống báo cáo. Em đang thực hiện hoàn thiện bản thảo quyển báo cáo đồ án. Kế hoạch tiếp theo là chuẩn bị demo và sửa bài báo cáo."),
  speechBody("Phần trình bày của em đến đây là kết thúc. Em xin cảm ơn quý thầy cô đã lắng nghe và rất mong nhận được sự góp ý cũng như câu hỏi từ hội đồng ạ."),

  new Paragraph({ pageBreakBefore: true }), // Sang trang mới cho phần Hỏi Đáp
  sectionTitle("PHẦN 2: CÁC CÂU HỎI PHẢN BIỆN DỰ KIẾN (Q&A)"),

  question("Dữ liệu của em lấy từ đâu? Có đủ độ tin cậy để làm nghiên cứu không?"),
  answer("Dạ, em sử dụng bộ dữ liệu hơn 650.000 URL được thu thập tự động qua API. Nguồn URL lừa đảo lấy từ PhishTank - đây là kho dữ liệu do cộng đồng báo cáo và có chuyên gia bảo mật xác minh (trạng thái verified: true), kết hợp với OpenPhish (dữ liệu nóng 24h). Nguồn URL an toàn lấy từ Tranco Top 1 Million - tiêu chuẩn vàng về các website có lưu lượng truy cập thật cao nhất thế giới. Do đó, dữ liệu làm nhãn cho mô hình là hoàn toàn khách quan và có độ tin cậy cao."),

  question("Tại sao em lại kết hợp cả Luật (Rule-based/Heuristic) và Học máy (Machine Learning)? Dùng 1 cái không được sao?"),
  answer("Dạ, em kết hợp vì chúng bù trừ cho nhau. Lớp Luật (Rule-based) đóng vai trò như 'cảnh sát gác cổng', giúp xử lý cực nhanh với độ chính xác tuyệt đối các mẫu lừa đảo đã biết hoặc chặn ngay các TLD rác, giúp giảm tải hệ thống. Lớp Học máy (ML) đóng vai trò như 'thám tử', có khả năng tổng quát hóa để phát hiện các trang lừa đảo mới tinh (Zero-day) hoặc các biến thể tinh vi có quan hệ phi tuyến tính mà con người không thể viết đủ luật IF-ELSE để bắt hết được."),

  question("Nếu hacker đổi URL liên tục (Zero-day phishing), Extension của em có bị lạc hậu không?"),
  answer("Dạ không ạ. Khác với phương pháp Danh sách đen (Blacklist) bị động, mô hình XGBoost của em không học thuộc lòng cái tên URL, mà học 'quy luật cấu trúc' (như độ nhiễu Entropy, số lượng Subdomain, sự xuất hiện của từ khóa kết hợp TLD). Hơn nữa, em đã dùng kỹ thuật Data Augmentation tự sinh các mẫu giả mạo để dạy AI. Nên dù URL mới vừa được tạo ra cách đây 1 phút, chỉ cần mang bản chất của phishing, hệ thống vẫn nhận diện được."),

  question("F1-Score là gì? Tại sao trong bảo mật em lại dùng F1-Score thay vì Accuracy (Độ chính xác)?"),
  answer("Dạ, Accuracy rất dễ bị sai lệch khi dữ liệu thực tế mất cân bằng (ví dụ 99% web là an toàn, AI cứ đoán bừa là an toàn cũng được 99% Accuracy). F1-Score là trung bình điều hòa giữa Precision (Độ chụm - hạn chế bắt nhầm người ngay) và Recall (Độ nhạy - hạn chế bỏ lọt tội phạm). Đây là thước đo khắt khe và công bằng nhất, buộc mô hình phải tối ưu cả hai mặt, đặc biệt quan trọng trong an toàn thông tin."),

  question("Em xử lý mất cân bằng dữ liệu bằng kỹ thuật SMOTE và Undersampling như thế nào?"),
  answer("Dạ, tập dữ liệu thực tế số trang an toàn luôn áp đảo trang lừa đảo. Em dùng Undersampling để cắt giảm bớt các mẫu an toàn (lớp đa số) cho gọn nhẹ. Đồng thời dùng SMOTE (Synthetic Minority Over-sampling Technique) để tự động sinh thêm các mẫu lừa đảo 'giả' (lớp thiểu số) bằng cách tính khoảng cách giữa các điểm dữ liệu. Việc này kéo tỷ lệ về 1:1, giúp AI không bị thiên kiến (bias) và học được nhiều biến thể lừa đảo hơn."),

  question("TLD là gì? Tại sao đuôi tên miền lại là một dấu hiệu rủi ro quan trọng?"),
  answer("TLD là Top-Level Domain (Tên miền cấp cao nhất) như .com, .vn, .xyz. Kẻ tấn công thường có xu hướng sử dụng các TLD giá rẻ hoặc miễn phí (như .tk, .xyz, .top) vì thủ tục đăng ký ẩn danh dễ dàng và chi phí thấp để chạy các chiến dịch lừa đảo ngắn hạn. Trong khi đó, các TLD như .gov, .edu, .vn được quản lý chặt chẽ nên rất hiếm khi bị lợi dụng. Do đó, TLD là một trọng số rất mạnh trong mô hình của em."),

  question("Trong 39 đặc trưng (Features), Entropy và Khoảng cách Levenshtein có ý nghĩa gì?"),
  answer("Dạ, về Entropy, em sử dụng công thức Shannon Entropy để đo lường sự phân bố tần suất của các ký tự trong URL. Với URL do con người đặt (như tuoitre.vn), các ký tự tuân theo quy luật ngôn ngữ tự nhiên, phân bố không đều (chữ 't', 'n' xuất hiện nhiều, chữ 'z', 'w' gần như không có), do đó điểm Entropy rất THẤP. Ngược lại, các URL do mã độc tự sinh (DGA) hoặc bị mã hóa thường bốc ngẫu nhiên các ký tự, khiến xác suất xuất hiện của mọi chữ cái và chữ số gần như ngang bằng nhau. Sự phân bố ngẫu nhiên hoàn toàn này sẽ tạo ra điểm Entropy cực kỳ CAO."),
  answer("Còn thuật toán Levenshtein dùng để tính số bước tối thiểu (thêm, bớt, sửa) để biến chuỗi này thành chuỗi kia. Đặc trưng này giúp em phát hiện kỹ thuật Typosquatting (hacker cố tình viết sai chính tả tên thương hiệu, ví dụ biến 'paypal' thành 'paypa1') mà các bộ lọc AI thông thường khó nhận ra."),

  question("Nếu một trang web uy tín nằm trong Whitelist (như trang giáo dục) bị hacker chèn mã độc thì sao?"),
  answer("Dạ, đây là vấn đề 'Contextual Whitelisting'. Dù domain nằm trong danh sách trắng (Layer 1-2), nhưng mô hình của em có thiết kế Layer 6 (Phân tích nội dung DOM). Nếu trang web đó bất ngờ xuất hiện một Form yêu cầu nhập mật khẩu gửi dữ liệu về server lạ, hoặc chứa Iframe ẩn, Layer 6 sẽ đánh giá rủi ro cực cao và 'ghi đè' (override) kết quả an toàn của Whitelist để đưa ra cảnh báo kịp thời."),

  question("Em tối ưu siêu tham số (Hyperparameters) cho mô hình XGBoost như thế nào?"),
  answer("Dạ, em sử dụng phương pháp RandomizedSearchCV kết hợp kiểm định chéo (Cross-Validation) 5-fold để máy tính tự động thử nghiệm 150 tổ hợp tham số. Em tập trung tối ưu 3 nhóm: tăng số cây (n_estimators=300) để quyết định chuẩn hơn, giảm tốc độ học (learning_rate=0.01) để học chắc chắn, và quan trọng nhất là áp dụng hệ số phạt L1 (reg_alpha=1) để chống lại hiện tượng 'học vẹt' (Overfitting), giúp mô hình chạy tốt trên dữ liệu thực tế."),

  question("Hệ thống mã nguồn của em được tổ chức như thế nào? Mỗi file đóng vai trò gì?"),
  answer("Dạ, hệ thống của em chia làm 2 phần độc lập: Phần Huấn luyện (Python) và Phần Chạy thực tế (Extension JavaScript). Quá trình này giống như việc mình 'đào tạo' một anh bảo vệ trong trường học, sau đó đưa anh ta ra 'đứng gác' ngoài thực tế."),
  answer("Phần Python gồm 4 file chính: Đầu tiên là 01_collect_data.py để tự động tải hàng trăm nghìn URL từ PhishTank và Tranco. Tiếp theo là 01a_augment_brand_data.py để tự tạo ra các URL giả mạo thương hiệu, dạy cho AI biết cách chống lại các cuộc tấn công Zero-day. File quan trọng nhất là 02_feature_extraction_v3.py giúp 'băm' URL thành 39 con số đặc trưng (như độ dài, Entropy, Levenshtein). Cuối cùng là 03_train_model_v4.py dùng thuật toán XGBoost và SMOTE để học 39 con số đó, rồi xuất ra một file 'bộ não' là model.json siêu nhẹ."),
  answer("Phần JavaScript (Extension) là nơi 'bộ não' đó hoạt động: File manifest.json là bản thiết kế xin quyền. File feature_extractor.js nằm ngay trên trình duyệt, có nhiệm vụ băm URL của người dùng thành 39 con số y hệt như Python. File xgboost_predictor.js là trái tim của hệ thống, nó chứa kiến trúc phòng thủ 8 lớp, đọc file model.json để tính toán xác suất lừa đảo. File content_analyzer.js hoạt động như một 'đội đặc nhiệm', quét mã HTML của trang web để tìm form mật khẩu hoặc xác nhận trang đó 'vô hại' (Harmless Check). Cuối cùng, file content.js sẽ nhận kết quả và vẽ Banner cảnh báo (Đỏ/Cam/Xanh) đè lên màn hình người dùng."),

  question("Tại sao em lại chọn xuất mô hình ra file JSON để chạy bằng JavaScript thuần mà không dùng thư viện AI?"),
  answer("Dạ, mục tiêu tối thượng của Extension là 'Real-time' (Thời gian thực) và không làm chậm trải nghiệm lướt web của người dùng. Nếu dùng các thư viện nặng như các thư viện học sâu (Deep Learning) sẽ tiêu tốn bộ nhớ và tăng độ trễ. Bằng cách huấn luyện ở Python nhưng xuất kiến trúc cây quyết định ra file JSON (chỉ khoảng 400KB), Extension có thể dùng JS thuần để duyệt các nhánh cây IF-ELSE, giúp tốc độ phản hồi tính bằng mili-giây (<5ms) và hoạt động 100% offline."),

  question("Bài toán Trade-off: Tại sao em chọn tốc độ nhanh (phân tích URL) thay vì độ chính xác cao hơn (dùng ML phân tích toàn bộ nội dung HTML)? Chậm một chút nhưng chính xác thì có đáng đổi không?"),
  answer("Dạ, trong môi trường nghiên cứu lý thuyết, sự đánh đổi (Trade-off) để lấy Độ chính xác là hoàn toàn xứng đáng. Nhưng trong bài toán Phishing thực tế, Tốc độ quyết định sự thành bại (Time-to-Compromise). Nếu mô hình ML mất 8 giây để tải HTML và phân tích xong văn bản, thì ở giây thứ 3 người dùng đã gõ xong mật khẩu và Enter. Một cảnh báo đúng nhưng bị trễ thì hậu quả vẫn là mất tài khoản."),
  answer("Để giải bài toán Trade-off này mà KHÔNG phải hy sinh Độ chính xác, em đã thiết kế Kiến trúc Lai (Hybrid): Em dùng AI (XGBoost) phân tích URL để lấy tốc độ chớp nhoáng. Đối với phần Nội dung (để đảm bảo độ chính xác, tránh bắt nhầm), em giao nhiệm vụ cho Lớp 6 (DOM Analysis). Lớp 6 không dùng AI cồng kềnh để 'đọc chữ', mà dùng JavaScript thuần chọc thẳng vào cây DOM để tìm các 'tử huyệt' (như thẻ <input type='password'>, iframe ẩn) chỉ mất vỏn vẹn 10 mili-giây. Sự kết hợp này giúp hệ thống của em vừa kiểm tra được nội dung thực tế để giữ Accuracy cao, vừa chặn đứng người dùng ngay lập tức ạ."),
];

const doc = new Document({
  sections: [{
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/BDTG/Desktop/Đồ Án Cơ Sở/KICH_BAN_BAO_VE_DO_AN.docx", buffer);
  console.log("Đã tạo tệp KICH_BAN_BAO_VE_DO_AN.docx thành công.");
});
