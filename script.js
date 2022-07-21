
//非同期処理
(async function main() {
  //必要な引数を定義
  const localVideo = document.getElementById('my-video');      //発信者側のビデオ情報
  const localId = document.getElementById('my-id');            //発信者側のPeerID
  const remoteVideo = document.getElementById('their-video');  //相手側のビデオ情報
  const remoteId = document.getElementById('their-id');        //相手側のPeerID

  const callTrigger = document.getElementById('make-call');    //発信ボタン
  const closeTrigger = document.getElementById('call-end');    //通話終了ボタン
  const mutebtn = document.getElementById('mute');             //ミュート切り替えボタン

  const yesbtn = document.getElementById('yes');               //「はい」ボタン
  const sosobtn = document.getElementById('soso');             //「わからない」ボタン
  const nobtn = document.getElementById('no');                 //「いいえ」ボタン

  const sendTrigger = document.getElementById('js-send-trigger');  //チャット送信ボタン
  const messages = document.getElementById('js-messages');         //メッセージ表示
  const localText = document.getElementById('js-local-text');      //送信する文章

  //カメラ,マイク情報取得(両方オンにしないとビデオ通話できない)
  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);


  //Peer作成(SkyWayに接続)
  const peer = new Peer( {
    //作成したAPIキー
    key: 'da6be063-02ee-4a88-a3a0-620e943ca8f7',
    debug: 3
  });
    
  //PeerID取得(ランダム英数字)
  peer.once('open', id => (localId.textContent = id));


  //発信ボタンを押したらビデオ通話開始(発信者側)
  callTrigger.addEventListener('click', () => {
      
    //相手のpeerIDに接続できなかった場合は終了する
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);
    const dataConnection = peer.connect(remoteId.value);

    // イベントリスナを設置する関数
    mediaConnection.on('stream', async stream => {
      // 相手のビデオ映像を再生
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
      
      //自分のビデオ映像を再生
      localVideo.srcObject = localStream;
      localVideo.playsInline = true;
      await localVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      //相手との接続が切れたら相手のビデオ映像を消す
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;

      //自分のビデオ映像を消す
      localVideo.srcObject.getTracks().forEach(track => track.stop());
      localVideo.srcObject = null;
    });

    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () =>{
       mediaConnection.close(true);
    });


    //テキスト送受信
    //開始時にメッセージ表示
    dataConnection.once('open', async () => {
      messages.textContent += `=== 相手と接続しました ===\n`;
      startTimer();

      //送信ボタンを押したらonClickSend関数を行う
      sendTrigger.addEventListener('click', onClickSend);

      //「はい」ボタンを押したらlocalTextに「はい」を代入してonClickSend関数を行う
      yesbtn.addEventListener('click', () => {
        localText.value = "はい";
        onClickSend();
      });
      //「わからない」ボタンを押したらlocalTextに「わからない」を代入してonClickSend関数を行う
      sosobtn.addEventListener('click', () => {
        localText.value = "わからない";
        onClickSend();
      });
      //「いいえ」ボタンを押したらlocalTextに「いいえ」を代入してonClickSend関数を行う
      nobtn.addEventListener('click', () => {
        localText.value = "いいえ";
        onClickSend();
      });
    });

    //相手側のチャット欄に文章を表示
    dataConnection.on('data', data => {
      messages.textContent += `相手: ${data}\n`;
      startTimer();
    });

    //終了するときにメッセージ表示
    dataConnection.once('close', () => {
      messages.textContent += `=== 相手と切断しました ===\n`;
      startTimer();
      sendTrigger.removeEventListener('click', onClickSend);
    });

    // 通話終了ボタンを押したらチャットも終わる
    closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });

    //送信する文章をdataに格納して自分側のチャット欄に表示
    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages.textContent += `あなた: ${data}\n`;
      startTimer();
      localText.value = '';
    }

    //タイマー、5秒後に文字が消える(関数を定義)
    var timerId;
    function startTimer() {
      timerId = setTimeout( function() {
        messages.textContent = "";
      } , 5000 );
    }
  });


  //着信処理(相手側)
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      //相手のビデオ映像を再生
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);

      //自分のビデオ映像を再生
      localVideo.srcObject = localStream;
      localVideo.playsInline = true;
      await localVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      //相手との接続が切れたら相手のビデオ映像を消す
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;

      //自分のビデオ映像を消す
      localVideo.srcObject.getTracks().forEach(track => track.stop());
      localVideo.srcObject = null;
    });

    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () => {
      mediaConnection.close(true);
    });
  });


  //相手側のテキスト送受信
  //開始時にメッセージ表示
  peer.on('connection', dataConnection => {
    dataConnection.once('open', async () => {
      messages.textContent += `=== 相手と接続しました ===\n`;
      startTimer();

      sendTrigger.addEventListener('click', onClickSend);

      //「はい」ボタンを押したらlocalTextに「はい」を代入してonClickSend関数を行う
      yesbtn.addEventListener('click', () => {
        localText.value = "はい";
        onClickSend();
      });
      //「わからない」ボタンを押したらlocalTextに「わからない」を代入してonClickSend関数を行う
      sosobtn.addEventListener('click', () => {
        localText.value = "わからない";
        onClickSend();
      });
      //「いいえ」ボタンを押したらlocalTextに「いいえ」を代入してonClickSend関数を行う
      nobtn.addEventListener('click', () => {
        localText.value = "いいえ";
        onClickSend();
      });
    });

    //相手側のチャット欄に文章を表示
    dataConnection.on('data', data => {
      messages.textContent += `相手: ${data}\n`;
      startTimer();
    });

    //終了するときにメッセージ表示
    dataConnection.once('close', () => {
      messages.textContent += `=== 相手と切断しました ===\n`;
      startTimer();
      sendTrigger.removeEventListener('click', onClickSend);
    });

    // 通話終了ボタンを押したらチャットも終わる
    closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });

    //送信する文章をdataに格納して自分側のチャット欄に表示
    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages.textContent += `あなた: ${data}\n`;
      startTimer();
      localText.value = '';
    }

    //タイマー、5秒後に文字が消える(関数を定義)
    function startTimer() {
      timerId = setTimeout( function() {
        messages.textContent = "";
      } , 5000 );
    }
    
  });


  //ミュートボタンを押したらミュートになる
  mutebtn.addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0];
    //マイクのミュートオンオフと、ボタンの文字を切り替え
    if(audioTrack.enabled == true){
      audioTrack.enabled = false;
      mutebtn.textContent = "マイクオフ";
    }else{
      audioTrack.enabled = true;
      mutebtn.textContent = "マイクオン";
    }
  });


  //現在時刻の表示
  const item = document.getElementById('item');
  function update(){
    let today = new Date();
    item.innerHTML = today.toLocaleString("ja");
    
    window.requestAnimationFrame(update);
  };
  update();
  
  
  //PeerIDを取得するときにエラーが出たらコンソールにエラー表示する
  peer.on('error', console.error);

  })();
