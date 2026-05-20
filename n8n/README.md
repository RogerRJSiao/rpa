# n8n 安裝與啟動指南

## 下載與安裝 Docker Desktop

1. 打開瀏覽器並前往 Docker 官方下載頁面：
   - https://www.docker.com/products/docker-desktop

2. 選擇適合你作業系統的版本。
   - Windows 使用者請下載 Windows 版安裝程式。

3. 下載完成後，執行安裝程式。
   - 如果系統提示需要啟用 WSL 2，請依照指示打開並重新啟動電腦 [Close and Reopen]。

4. 安裝完成後，啟動 Docker Desktop。
   - 如果首次使用，Docker Desktop 可能會提示你登入 Docker Hub 帳號，這一步驟通常可跳過。

5. 確認 Docker Desktop 已成功啟動。
   - 在系統列可以看到 Docker 圖示。
   - 也可打開命令提示字元或 PowerShell，輸入 `docker version` 來確認 Docker 正常運作。

## 下載並啟動 n8n

1. 目前建議透過 Docker 來執行 n8n，這樣比較穩定且免安裝 Node.js 環境。

2. 打開命令提示字元或 PowerShell，切換到你想放置 n8n 設定的資料夾，例如：
   ```powershell
   cd D:\git_proj\rpa\n8n
   ```

3. 執行以下指令以下載並啟動 n8n：
   ```powershell
   docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
   ```
   - `-p 5678:5678`：將本機的 5678 連接埠對應到 n8n 容器。
   - `-v n8n_data:/home/node/.n8n`：將 Docker volume `n8n_data` 掛載為 n8n 的設定與資料儲存位置。

4. 成功啟動後，開啟瀏覽器並前往：
   - `http://localhost:5678`

5. 在瀏覽器中即可看到 n8n 的使用者介面，開始建立工作流程。

## 進階建議

- 若想讓 n8n 長期運行，建議改用 Docker Compose 或建立 Windows 服務來管理容器。亦可考慮放上雲端空間使用。
- 若需要永久儲存資料，請確認 `-v` 掛載路徑已正確設定，避免容器刪除後資料遺失。
