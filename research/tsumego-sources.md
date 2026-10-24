# Nguồn tsumego có license mở và định dạng SGF

Ticket: [#4](https://github.com/jamestran1/covay/issues/4) (map [#1](https://github.com/jamestran1/covay/issues/1)). Ngày nghiên cứu: 2026-10-24.

Câu hỏi: bộ tsumego nào có thể đóng gói hợp pháp vào một web app open source, miễn phí, cho người mới (30k-15k)? Parser SGF cần hỗ trợ những gì để đọc đề và cây đáp án?

> Lưu ý: đây là phân tích kỹ thuật, không phải tư vấn pháp lý. Kết luận về bản quyền dựa trên những gì chính các nguồn tuyên bố (hoặc không tuyên bố).

## TL;DR

- **Không có bộ tsumego cho người mới nào vừa đủ lớn vừa có license mở rõ ràng.** Các kho phổ biến trên GitHub (sanderland/tsumego, kisvadim/goproblems) chứa sách của các kỳ thủ hiện đại (Cho Chikun, Maeda, Hashimoto, Lee Changho...) mà không có giấy phép từ tác giả. GoProblems.com ghi rõ giữ bản quyền. OGS: người đăng giữ quyền, chỉ cấp license cho OGS.
- **Sách cổ (Xuanxuan Qijing 1347, Igo Hatsuyoron 1713, Gokyo Shumyo 1812) là public domain về nội dung**, nhưng chủ yếu ở trình độ dan, không hợp với 30k-15k. Bản SGF trên mạng không kèm license, và phần đáp án do người hiện đại thêm vào là tác phẩm mới.
- **Khuyến nghị: tự soạn bộ đề cho người mới** (khoảng 100-200 bài đầu, 9x9 hoặc góc 19x19), phát hành dưới CC0 hoặc CC BY 4.0 ngay trong repo. Bổ sung bằng một số bài dễ tự chọn và tự viết lại đáp án từ Gokyo Shumyo. Không bundle Cho Chikun / GoProblems / OGS.
- **Định dạng nội bộ: SGF FF[4] với quy ước đánh dấu đúng/sai riêng của dự án**, parser đọc thêm được các quy ước phổ biến (`RIGHT` trong `C[]` kiểu GoProblems, `WV`/`TR` kiểu uliGo, `TE`/`BM`, "Correct"/"Wrong").

## 1. Các nguồn ứng viên

### 1.1 sanderland/tsumego ("Ten Thousand Tsumego")

- Repo: <https://github.com/sanderland/tsumego>. GitHub báo license `NOASSERTION`.
- File [`LICENSE`](https://github.com/sanderland/tsumego/blob/master/LICENSE) là MIT nhưng câu đầu ghi "Code is Copyright 2020 Sander Land and/or other authors of the content". File [`CONTRIBUTORS`](https://github.com/sanderland/tsumego/blob/master/CONTRIBUTORS) chỉ cảm ơn "Original Tsumego authors" và "TsumegoDojo for collecting many of the original files". Không có giấy phép nào từ tác giả gốc.
- Nội dung (đếm từ git tree, 12.653 file): "1a. Tsumego Beginner" gồm Cho Chikun Encyclopedia Life And Death - Elementary (900), Ishigure Ikuro 123 Basic Tsumego (123), Fujisawa Shuuko Elementary (40), Yamada Kimio Basic (20). Phần Intermediate/Advanced: Cho Chikun Intermediate (861), Advanced (792), Maeda, Ishida Akira, Hashimoto Utaro (nhiều tập), Go Seigen Segoe Tesuji Dictionary, Lee Changho Tesuji, Tesuji Great Dictionary...
- Định dạng: JSON riêng, mỗi bài một file, ví dụ `Prob0001.json`: `{"AB": [...], "AW": [...], "SZ": "19", "C": "Black to play: Elementary", "SOL": [["B", "ba", "Correct.", ""]]}`. Chỉ có đường đáp án chính, không có cây biến sai.
- Đánh giá: **không bundle được.** Cho Chikun và Lee Changho còn sống; Maeda Nobuaki, Hashimoto Utaro, Go Seigen mất sau 1955 nên tác phẩm còn trong thời hạn bảo hộ ở EU (tác giả + 70 năm, [Directive 2006/116/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0116)). License MIT của repo chỉ áp dụng cho code.

### 1.2 kisvadim/goproblems

- <https://github.com/kisvadim/goproblems>: không có license, README chỉ một dòng "A lot of go problems". Thư mục là cùng các bộ sách hiện đại (Cho Chikun, Go Seigen, Hashimoto, Kada Katsuji, Kano Yoshinori 239 Graded Go Problems, Lee Changho...). **Không bundle được** (cùng lý do 1.1, thêm việc không có license nào).

### 1.3 Cho Chikun Encyclopedia of Life and Death

- Tác giả còn sống, sách thương mại. Các bản SGF lưu hành (1.1, 1.2, tasuki) đều không ghi nguồn hợp pháp. Tasuki tự viết trong [FAQ](https://github.com/tasuki/tsumego-web/blob/master/source/faq.html.haml): "The Cho Chikun encyclopedia, I quite honestly can't tell" (nguồn), và "Is it legal...? I hope so (I am not publishing solutions, only board positions...)".
- Đánh giá: **không bundle.** Đây là bộ beginner tốt nhất về sư phạm (900 bài elementary), nhưng rủi ro pháp lý cao nhất.

### 1.4 Sách cổ: Xuanxuan Qijing, Igo Hatsuyoron, Gokyo Shumyo, Guanzi Pu

Theo bảng trên Sensei's Library [ClassicalGoProblemBooks](https://senseis.xmp.net/?ClassicalGoProblemBooks):

| Bộ | Năm | Số bài | Trình độ |
|---|---|---|---|
| Xuanxuan Qijing (玄玄棋經) | 1347 | 347, hỗn hợp | chủ yếu dan |
| Guanzi Pu (官子譜) | 1660 | 1473, hỗn hợp | khó |
| Igo Hatsuyoron (囲碁発陽論) | 1713 | 183, sống chết | cực khó (khó cả với pro) |
| Gokyo Shumyo (碁経衆妙) | 1812 | 520, phân loại theo chủ đề | "dễ nhất" trong nhóm cổ, kyu đến dan |

Bình luận trên cùng trang (John F.): "generally the problems in the above list range from hard to very hard (5-dan plus)... The easiest is the Gokyo Shumyo."

- **Bản quyền nội dung:** tác giả mất từ hàng trăm năm, nên vị trí bàn cờ là public domain.
- **Bản SGF:** nguồn chính là [u-go.net/classic](http://www.u-go.net/classic/) (Ulrich Görtz). Trang này không ghi license. Ulrich viết rằng file lấy từ Flygo "with kind permission", và đáp án cho 85 bài Gokyo Shumyo là "I added solutions and refutations... myself"; file Xuanxuan Qijing (347 bài có đáp án) do Jean-Pierre Vesinet "compiled from free sources on the web". Các bài Gokyo Shumyo còn lại "only contain the initial position". Tasuki (<https://github.com/tasuki/tsumego>) không có license và cũng chỉ in thế cờ, không in đáp án.
- **Rủi ro:** phần đáp án và chú thích do người hiện đại viết là tác phẩm mới có bản quyền. Ở EU/EEA còn có quyền sui generis cho cơ sở dữ liệu ([Directive 96/9/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31996L0009)) nếu có đầu tư đáng kể để tổng hợp. Cách an toàn: **tự nhập lại thế cờ từ sách cổ (public domain) và tự viết đáp án**, không sao chép nguyên file SGF.
- **Độ phù hợp với 30k-15k:** thấp. Chỉ một phần nhỏ Gokyo Shumyo dùng được cho người mới.

### 1.5 uliGo (bộ đề kèm chương trình)

- uliGo của Ulrich Görtz phát hành dưới GPL v2 (bản sao tại [rikuge/uligo_spaced/doc/license.txt](https://github.com/rikuge/uligo_spaced/blob/master/doc/license.txt); gói AUR [aur-archive/uligo](https://github.com/aur-archive/uligo) ghi `license='GPL'`). Kèm `sgf/easy.sgf` ("A collection of 40 easy problems") và `sgf/hard.sgf` (40 bài), định dạng FF[3].
- Đánh giá: có thể dùng nếu chấp nhận coi file đề là một phần của gói GPL v2, nhưng không có tuyên bố license riêng cho file đề, chỉ 80 bài, và "easy" là theo chuẩn của uliGo (không phải 30k). GPL v2 cũng ràng buộc license của app nếu bundle chung. **Không khuyến nghị làm nguồn chính.**

### 1.6 OGS (online-go.com) puzzles

- API công khai, ví dụ `GET https://online-go.com/api/v1/puzzles/2` trả về JSON: `initial_state` (chuỗi tọa độ SGF ghép liền cho `black`/`white`), `initial_player`, `width`/`height` (ví dụ 9x9), `move_tree` lồng nhau với các cờ `correct_answer: true` / `wrong_answer: true` và `text`, `puzzle_rank`, `puzzle_type: "life_and_death"`. Có nhiều bài người mới, xếp theo rank.
- Điều khoản ([`src/views/docs/legal.tsx`](https://github.com/online-go/online-go.com/blob/main/src/views/docs/legal.tsx)): "Online-Go.com does not claim ownership of any Content you submit... you grant Online-Go.com the following... license". Tức là license chỉ cấp cho OGS; bên thứ ba như covay không được gì. Mỗi puzzle thuộc về người đăng (ví dụ puzzle 2 thuộc user "AirKing"), và nhiều collection là chép lại từ sách.
- Đánh giá: **không bundle**. Chỉ có thể dùng nếu xin phép từng tác giả collection, và phải kiểm tra bài đó không chép từ sách.

### 1.7 GoProblems.com

- API `GET https://www.goproblems.com/api/v2/problems/{id}` trả về `sgf`, `elo`, `problemLevel`, `genre`, `author` (mỗi bài có tác giả riêng).
- Chính site ghi trong chuỗi giao diện của trang Download (bundle JS `index-*.js`, khóa `download.usage`): **"GoProblems.com retains the copyright, so please do not redistribute the files without permission."**
- Đánh giá: **không bundle**. Tuy vậy, quy ước SGF của GoProblems là chuẩn thực tế nên parser cần hiểu (xem mục 2).

### 1.8 101weiqi (101围棋网)

- Nền tảng thương mại ở Trung Quốc, có chức năng "录入题目" (người dùng nhập đề) và "棋书" (sách điện tử). Không tìm thấy bất kỳ license mở nào trên trang chủ. Mặc định là bảo lưu mọi quyền; nhiều đề lấy từ sách. **Không bundle.**

### 1.9 Các repo GitHub khác

- [frank99-owl/go-daily](https://github.com/frank99-owl/go-daily): PolyForm Perimeter 1.0.1 (source-available, cấm sản phẩm cạnh tranh). Không phải open source.
- [benjaminmantle/baduk-study-material](https://github.com/benjaminmantle/baduk-study-material): danh mục link, tự đánh dấu "⚠ grey licensing". Không phải dataset có license.
- [MachineKomi/Infinite_AI_Tsumego_Miner](https://github.com/MachineKomi/Infinite_AI_Tsumego_Miner) (AGPL-3.0): sinh đề từ ván tự đấu của AI. Ý tưởng hay cho tương lai (thế cờ sinh tự động không có tác giả là người), nhưng chất lượng sư phạm cho 30k chưa được kiểm chứng, và AGPL không hợp nếu chỉ muốn lấy dữ liệu.

### Bảng tổng hợp

| Nguồn | License đề | Số bài beginner (30k-15k) | Định dạng | Bundle? |
|---|---|---|---|---|
| sanderland/tsumego | Không có (MIT chỉ cho code) | ~1.000 (Cho Elementary, Ishigure 123...) | JSON riêng, chỉ đường đúng | Không |
| kisvadim/goproblems | Không có | nhiều | SGF | Không |
| Sách cổ (u-go.net, tasuki) | Thế cờ public domain; file SGF/đáp án không license | rất ít | SGF FF[3]/FF[4] | Chỉ khi tự nhập lại |
| uliGo easy/hard | GPL v2 (theo gói) | ít (40 easy) | SGF FF[3] + `WV` | Có điều kiện, không khuyến nghị |
| OGS puzzles | Thuộc người đăng, chỉ license cho OGS | nhiều | JSON `move_tree` | Không (trừ khi xin phép) |
| GoProblems.com | "retains the copyright" | nhiều | SGF + marker trong `C[]` | Không |
| 101weiqi | Không có license mở | rất nhiều | riêng | Không |
| Tự soạn | CC0 / CC BY 4.0 do mình chọn | bao nhiêu tùy soạn | SGF FF[4] theo quy ước dự án | **Có** |

## 2. Những gì parser SGF cần hỗ trợ

Nguồn đặc tả: [SGF FF[4]](https://www.red-bean.com/sgf/sgf4.html), [danh sách property](https://www.red-bean.com/sgf/properties.html), [phần riêng cho Go (GM[1])](https://www.red-bean.com/sgf/go.html), [FF[3]](https://www.red-bean.com/sgf/ff1_3/ff3.html).

### 2.1 Cú pháp chung

- Cây trò chơi `( ; node ; node ( ;biến 1 ) ( ;biến 2 ) )`, nhiều game tree trong một file (collection). uliGo nhét cả bộ đề vào một file, mỗi bài một `(;GM[1]FF[3] ...)`, và coi mọi thứ trước dấu `(` đầu tiên là chú thích chung ([manual uliGo](https://github.com/rikuge/uligo_spaced/blob/master/doc/manual.rst)).
- Giá trị Text: escape `\]` và `\\`; "soft line break" (xuống dòng ngay sau `\`) bị xóa; phải chấp nhận LF, CR, CRLF, LFCR (sgf4.html, mục 3.2).
- Property không biết phải bỏ qua chứ không báo lỗi (sgf4.html "How to handle unknown/faulty properties"). Private property như `WV` phải đọc được.
- `CA[]` chỉ định charset, mặc định ISO-8859-1 (properties.html). File Trung/Nhật/Việt hay là UTF-8 hoặc GB2312/Shift_JIS: nên đọc `CA` rồi giải mã bằng `TextDecoder`.
- Danh sách điểm nén (FF[4] "Compressed point lists"): `AB[aa:cc]` là hình chữ nhật từ aa đến cc. Phải bung ra.

### 2.2 Setup đề

- `AB`, `AW`: đặt quân, không gây ăn quân; `AE`: xóa điểm (properties.html, nhóm setup).
- `PL[B|W]`: ai đi trước. Nếu thiếu, suy ra từ nước đầu tiên trong cây đáp án, hoặc từ comment ("Black to play" như sanderland, "black to live" như GoProblems).
- `SZ[n]` hoặc `SZ[c:r]` (bàn chữ nhật, FF[4]). Nếu thiếu: FF[4] mặc định 19. Tọa độ là hai chữ cái thường, cột trước dòng sau, gốc trên trái; bàn nhỏ dùng phần trên trái (go.html). Nhiều đề là góc của bàn 19x19 (ví dụ GoProblems puzzle 1500 không có `SZ`), nên app cần **tự tính vùng hiển thị (bounding box + lề) để zoom vào góc**, tách khỏi `SZ`.
- Nước pass: `B[]`, hoặc `B[tt]` với bàn <= 19x19 (go.html). FF[3] chỉ dùng `tt`.
- Có thể gặp setup ở node không phải gốc (uliGo bỏ qua các node đầu cho đến khi gặp `AB`/`AW`).

### 2.3 Cây đáp án và đánh dấu đúng/sai

Không có chuẩn chung; mỗi nguồn một kiểu:

| Quy ước | Nguồn | Ý nghĩa |
|---|---|---|
| `RIGHT` trong `C[]` ở node lá | GoProblems, code [eidogo bản goproblems `sgf.js`](https://github.com/adum/eidogo/blob/master/player/js/sgf.js) (regex `/RIGHT/`, sau đó xóa chữ khỏi comment) | đường này đúng; mọi lá khác là sai |
| `CHOICE` trong `C[]` | như trên | máy chọn ngẫu nhiên giữa các phản đòn được đánh dấu |
| `NOTTHIS` trong `C[]` | như trên, `player.js` `moveAllowed` | không cho người chơi đi nước này |
| `FORCE` trong `C[]` | như trên | người chơi chỉ được đi các nước có trong cây |
| `WV[]` (private) hoặc `TR[]` ở nước đầu của biến sai | uliGo manual | biến sai; mặc định các biến khác là đúng |
| `TE[]` / `BM[]` (cũng `DO`, `IT`) | SGF FF[4] chuẩn | tesuji (tốt) / nước xấu, ở node có nước đi |
| `C[Correct...]`, `C[Wrong...]` | sanderland (`"Correct."`), nhiều bộ SGF lưu hành | chuỗi tự do |
| `correct_answer` / `wrong_answer` | OGS JSON | cờ trên node `move_tree` (không phải SGF) |

Khuyến nghị cho parser:
1. Đọc cây đầy đủ (mọi biến) thành model trung lập: `ProblemNode { move, comment, verdict: correct | wrong | unknown, children }`.
2. Một tầng "dialect adapter" chuyển marker sang `verdict` theo thứ tự ưu tiên: marker tường minh của dự án, rồi `RIGHT`/`WV`/`TR`/`TE`/`BM`, rồi heuristic chuỗi "correct"/"wrong" (không phân biệt hoa thường).
3. Nước của người chơi không có trong cây là sai (mô hình eidogo/uliGo), máy đáp bằng biến con đầu tiên (hoặc ngẫu nhiên nếu có `CHOICE`).
4. Hỗ trợ nhiều đáp án đúng (nhiều nhánh `RIGHT`); u-go.net cảnh báo file Guanzi Pu chỉ có một đáp án nên hoán vị nước cuối có thể bị chấm sai.

### 2.4 Đặc thù FF[3] và file cũ

- `FF[3]` (uliGo, nhiều file cổ): pass là `tt`, thường thiếu `CA`. Theo đặc tả FF[3], chữ thường trong tên property không có nghĩa ("LB[] = LaBel[] = ..."), nên parser phải bỏ chữ thường khi đọc ID (ví dụ `AddBlack[..]` là `AB`). Property cũ/lạ (kể cả label kiểu cũ) thì bỏ qua thay vì báo lỗi.
- Markup `LB`, `TR`, `SQ`, `CR`, `MA` nên giữ để hiển thị hướng dẫn trong bài học; nhưng nhớ `TR` có nghĩa "biến sai" trong dialect uliGo.
- `GN`, `GC`, `C` ở gốc: tiêu đề và mô tả đề.

## 3. Khuyến nghị

**Nguồn chính: tự soạn bộ đề beginner của covay.**
- Lý do: không nguồn nào có license mở rõ ràng cho 30k-15k; mức này lại dễ soạn (bắt quân, atari, thang, lưới, mắt thật/giả, sống chết cơ bản 6 quân), và thế cờ cơ bản ở mức này là kiến thức chung, khó ai đòi quyền.
- Cách làm: viết SGF FF[4] tay hoặc bằng editor (Sabaki), lưu trong repo (ví dụ `content/tsumego/*.sgf`), license **CC0** (dễ cho người khác dùng lại) hoặc **CC BY 4.0**, tách license nội dung khỏi license code. Dùng một quy ước marker rõ ràng của dự án (ví dụ `TE[1]`/`BM[1]` chuẩn SGF, hoặc `C[RIGHT]` cho tương thích GoProblems), cộng metadata cấp độ trong root (ví dụ property riêng hoặc trường trong file index).
- Kiểm chứng đáp án bằng chính AI engine (KataGo) của dự án trong một script offline để tránh đề sai.

**Nguồn dự phòng / mở rộng:**
1. Sách cổ public domain (ưu tiên Gokyo Shumyo, phần dễ): tự nhập lại thế cờ, tự viết đáp án, ghi nguồn gốc trong metadata. Không copy nguyên file SGF/đáp án từ u-go.net.
2. Xin phép tường minh (bằng văn bản, kèm license CC) từ tác giả các collection beginner trên OGS hoặc GoProblems, sau khi xác nhận đề là sáng tác gốc.
3. Về sau: đề sinh tự động từ ván AI tự đấu (hướng của Infinite_AI_Tsumego_Miner), tự cài đặt lại để không dính AGPL.

**Không làm:** bundle Cho Chikun, sanderland/tsumego, kisvadim/goproblems, GoProblems, OGS, 101weiqi.

**Parser:** đọc FF[3] và FF[4] đầy đủ (biến, escape, point list nén, `CA`, `SZ` chữ nhật, pass `[]`/`tt`), cộng dialect adapter cho `RIGHT`/`CHOICE`/`NOTTHIS`/`FORCE`, `WV`/`TR`, `TE`/`BM`, chuỗi "Correct"/"Wrong". Tự tính vùng zoom từ các quân, không dựa vào `SZ`.

## Nguồn

- sanderland/tsumego: <https://github.com/sanderland/tsumego> (`LICENSE`, `CONTRIBUTORS`, cây thư mục `problems/`, `Prob0001.json`)
- kisvadim/goproblems: <https://github.com/kisvadim/goproblems>
- tasuki: <https://github.com/tasuki/tsumego>, <https://github.com/tasuki/tsumego-web/blob/master/source/faq.html.haml>
- Ulrich Görtz, Classical go problems: <http://www.u-go.net/classic/>
- uliGo (GPL v2, manual, easy.sgf): <https://github.com/rikuge/uligo_spaced>, <https://github.com/aur-archive/uligo>
- Sensei's Library, Classical Go Problem Books: <https://senseis.xmp.net/?ClassicalGoProblemBooks>
- OGS API: <https://online-go.com/api/v1/puzzles/2>; điều khoản: <https://github.com/online-go/online-go.com/blob/main/src/views/docs/legal.tsx>
- GoProblems API: <https://www.goproblems.com/api/v2/problems/1500>; chuỗi `download.usage` trong bundle JS của <https://www.goproblems.com/>
- eidogo bản goproblems: <https://github.com/adum/eidogo> (`player/js/sgf.js`, `player/js/player.js`, `js/goproblems.js`)
- 101weiqi: <https://www.101weiqi.com/>
- SGF: <https://www.red-bean.com/sgf/sgf4.html>, <https://www.red-bean.com/sgf/properties.html>, <https://www.red-bean.com/sgf/go.html>, <https://www.red-bean.com/sgf/ff1_3/ff3.html>
- EU: Directive 2006/116/EC (thời hạn bảo hộ), Directive 96/9/EC (cơ sở dữ liệu)
