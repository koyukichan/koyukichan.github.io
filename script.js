
//非同期処理
(async function main() {
  //必要な引数を定義
  const localVideo = document.getElementById('my-video');          //発信者側のビデオ情報
  const localId = document.getElementById('my-id');                //発信者側のPeerID
  const remoteVideo = document.getElementById('their-video');      //相手側のビデオ情報
  const remoteId = document.getElementById('their-id');            //相手側のPeerID

  const callTrigger = document.getElementById('make-call');        //発信ボタン
  const closeTrigger = document.getElementById('call-end');        //通話終了ボタン
  const mutebtn = document.getElementById('mute');                 //ミュート切り替えボタン

  const yesbtn = document.getElementById('yes');                   //「はい」ボタン
  const sosobtn = document.getElementById('soso');                 //「わからない」ボタン
  const nobtn = document.getElementById('no');                     //「いいえ」ボタン

  const sendTrigger = document.getElementById('js-send-trigger');  //チャット送信ボタン
  const messages = document.getElementById('js-messages');         //メッセージ表示
  const localText = document.getElementById('js-local-text');      //送信する文章
  const Voice = document.getElementById('voice-word');             //音声入力ボタン

  const HELP = document.getElementById('help-btn');                //助けてボタン

  const CallY = document.getElementById('call-yes');               //着信処理モーダルウィンドウの「はい」ボタン
  const Calln = document.getElementById('call-no');                //着信処理モーダルウィンドウの「いいえ」ボタン
  const modal = document.getElementById('callModal');              //着信処理モーダルウィンドウ

  const NotModal = document.getElementById('notModal');            //着信拒否されたモーダルウィンドウ
  const notCall = document.getElementById('not-call');             //閉じるボタン

  const NoModal = document.getElementById('noModal');              //着信拒否したモーダルウィンドウ
  const noCall = document.getElementById('no-call');               //閉じるボタン


  //カメラとマイク情報取得(両方オンにしないとビデオ通話できない)
  const localStream = await navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .catch(console.error);

  //プッシュ通知を許可するかの確認
  Notification.requestPermission(function(permission) {
    switch (permission) {
      case 'granted':  //通知許可
        console.log('リクエストは許可されました。');
        break;
      case 'denied':   //通知ブロック
        console.log('リクエストはブロックされました。');
        break;
      default:         //Chromeではブロック扱い
        console.log('リクエストのポップアップが閉じられました。');
    }
  });

  //ミュートボタン
  mutebtn.addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0];
    //マイクのオンオフと、ボタンの文字を切り替え
    if(audioTrack.enabled == true){
      //マイクオフ
      audioTrack.enabled = false;
      mutebtn.textContent = "🔈";
    }else{
      //マイクオン
      audioTrack.enabled = true;
      mutebtn.textContent = "🔊";
    }
  });

  //通話終了後のブラウザ更新用タイマー
  var timerId;
  function reloadTimer() {
    timerId = setTimeout( function() {
      document.location.reload();
    } , 5000 );
  }


  //Peer作成(SkyWayに接続)
  const peer = new Peer( {
    //作成したAPIキー
    key: '6c1513ac-402a-45f4-b9e2-7b3eb3ee0ed4',
    debug: 3
  });
    
  //PeerID取得(ランダム英数字)
  peer.once('open', id => (localId.textContent = id));

  //セレクトボックスにPeerID一覧を表示
  peer.once("open", () => {
    peer.listAllPeers((peers) => {
      //peerIDを配列に格納
      const ID = Array.from(peers);
      //格納した配列をセレクトボックスの選択肢に追加
      for(var i=0; i<ID.length; i++){
        const option = document.createElement("option");
        if(localId.textContent != ID[i]){
          option.value = ID[i];
          option.textContent = ID[i];
          remoteId.appendChild(option);
        }else{
          //自分のIDをセレクトボックスに入れないようにする
          option.value = ID[i];
        }
      }
    });
  });

  //PeerIDを取得するときにエラーが出たら表示
  peer.on('error', console.error);


  //★発信者側
  callTrigger.addEventListener('click', () => {
    //相手のpeerIDに接続できなかった場合は終了する
    if (!peer.open) {
      return;
    }
 
    //お助けプッシュ通知　※このままでは相手に届かない
    HELP.addEventListener('click', () => {
      var helpmes = new Notification("助けが必要です！！");
    })

    const mediaConnection = peer.call(remoteId.value, localStream);
    const dataConnection = peer.connect(remoteId.value);


    // ここに待機画面をつく
    dataConnection.once('close', () => {
      //拒否されたことを通知するモーダルウィンドウを表示
      NotModal.style.display = 'block';
      reloadTimer();
      //閉じるボタン
      notCall.addEventListener('click', modalClose);
      function modalClose() {
        NotModal.style.display = 'none';       //通知ウィンドウを閉じる
      }
    })

    mediaConnection.on('stream', async stream => {
      messages.textContent += '=== 接続しました ===\n';
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
      reloadTimer();                //ブラウザ更新
      messages.textContent += '=== 切断しました ===\n';
    });
    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () => {
      mediaConnection.close(true);
    });


    //発信者側チャット
    //開始時にメッセージ表示
    dataConnection.once('open', async () => {
      //送信ボタンを押したらonClickSend関数を行う
      sendTrigger.addEventListener('click', onClickSend);
      //「はい」ボタンを押したらlocalTextに「はい」を代入
      yesbtn.addEventListener('click', () => {
        localText.value = "はい";
        onClickSend();
      });
      //「わからない」ボタンを押したらlocalTextに「わからない」を代入
      sosobtn.addEventListener('click', () => {
        localText.value = "わからない";
        onClickSend();
      });
      //「いいえ」ボタンを押したらlocalTextに「いいえ」を代入
      nobtn.addEventListener('click', () => {
        localText.value = "いいえ";
        onClickSend();
      });
    });
    //相手側のチャット欄に文章を表示
    dataConnection.on('data', data => {
      messages.textContent += '相手: ${data}\n';
      messages.scrollTo(0, messages.scrollHeight);
    });
    // 通話終了ボタンを押したらチャットも終わる　※無くさないと拒否通知が出てきてしまう
    /*closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });*/
    //送信する文章をdataに格納して自分側のチャット欄に表示
    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);
      messages.textContent += 'あなた: ${data}\n';
      localText.value = '';
      //チャットスクロールを下にする
      messages.scrollTo(0, messages.scrollHeight);
    }


    //音声認識で文字起こし
    //Web Speech API(Webページでブラウザの音声認識機能を使うためのAPI ※Chromeのみ対応)を使用
    SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
    const recognition = new SpeechRecognition();
    //言語を日本語指定
    recognition.lang = 'ja-JP';
    //聞き取った音声を文字に変換してチャットボックスに表示
    recognition.onresult = (event) => {
      for(let i = event.resultIndex; i < event.results.length; i++) {
        let voiceword = event.results[i][0].transcript;
        localText.value = voiceword;
      }
    }
    //音声入力ボタンを押すと音声入力
    Voice.addEventListener('click', () => {
      recognition.start();
      voiceword = '';
      //音声入力ができないブラウザのときにアラートを表示
      if ('SpeechRecognition' in window) {
        // ユーザのブラウザが音声入力に対応しているとき
      } else {
        // ユーザのブラウザが音声入力に対応していないとき
        alert("このブラウザでは音声入力ができません");
      }
    });
  });


  //★受信者側
  peer.on('call', mediaConnection => {
    //着信通知
    var videomes = new Notification("着信があります");

    //着信を応答するか拒否するかを選択するモーダルウィンドウを表示
    modal.style.display = 'block';
    //モーダルウィンドウの「いいえ」がクリックされた時
    Calln.addEventListener('click', modalClose);
    function modalClose() {
      modal.style.display = 'none';       //選択ウィンドウを閉じる
      peer.destroy();                     //シグナリングサーバ切断

      //拒否したことを通知するモーダルウィンドウを表示
      NoModal.style.display = 'block';
      //モーダルを閉じる
      noCall.addEventListener('click', modalClose);
      function modalClose() {
        NoModal.style.display = 'none';       //通知ウィンドウを閉じる
        reloadTimer();
      }
    }
    //モーダルウィンドウ以外がクリックされた時
    addEventListener('click', outsideClose);
    function outsideClose(e) {
      if (e.target == modal) {
        modal.style.display = 'none';           //選択ウィンドウを閉じる
        peer.destroy();                         //シグナリングサーバ切断
        reloadTimer();                          //ブラウザ更新

        //拒否したことを通知するモーダルウィンドウを表示
        NoModal.style.display = 'block';
        //モーダルを閉じる
        noCall.addEventListener('click', modalClose);
        function modalClose() {
          NoModal.style.display = 'none';       //通知ウィンドウを閉じる
        }
      }
    }
    //モーダルウィンドウの「はい」がクリックされたらビデオ通話開始
    CallY.addEventListener('click', () => {
      modal.style.display = 'none';
      mediaConnection.answer(localStream);
    });


    //お助けプッシュ通知
    HELP.addEventListener('click', () => {
      var helpmes = new Notification("助けが必要です！！");
    })    

    mediaConnection.on('stream', async stream => {
      messages.textContent += '=== 接続しました ===\n';
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
      reloadTimer();                  //ブラウザ更新
      messages.textContent += '=== 切断しました ===\n';
    });
    
    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () => {
      mediaConnection.close(true);
    });
  });


  //相手側のチャット
  //開始時にメッセージ表示
  peer.on('connection', dataConnection => {
    dataConnection.once('open', async () => {
      //送信ボタンを押したらonClickSend関数を行う
      sendTrigger.addEventListener('click', onClickSend);
      //「はい」ボタンを押したらlocalTextに「はい」を代入
      yesbtn.addEventListener('click', () => {
        localText.value = "はい";
        onClickSend();
      });
      //「わからない」ボタンを押したらlocalTextに「わからない」を代入
      sosobtn.addEventListener('click', () => {
        localText.value = "わからない";
        onClickSend();
      });
      //「いいえ」ボタンを押したらlocalTextに「いいえ」を代入
      nobtn.addEventListener('click', () => {
        localText.value = "いいえ";
        onClickSend();
      });
    });
    //相手側のチャット欄に文章を表示
    dataConnection.on('data', data => {
      messages.textContent += '相手: ${data}\n';
      messages.scrollTo(0, messages.scrollHeight);
    });
    //送信する文章をdataに格納して自分側のチャット欄に表示
    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);
      messages.textContent += 'あなた: ${data}\n';
      localText.value = '';
      //チャットスクロール下にする
      messages.scrollTo(0, messages.scrollHeight);
    }

    
    //音声認識で文字起こし
    //Web Speech API(Webページでブラウザの音声認識機能を使うためのAPI ※Chromeのみ対応)を使用
    SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
    const recognition = new SpeechRecognition();
    //言語を日本語指定
    recognition.lang = 'ja-JP';
    //聞き取った音声を文字に変換してチャットボックスに表示
    recognition.onresult = (event) => {
      for(let i = event.resultIndex; i < event.results.length; i++) {
        let voiceword = event.results[i][0].transcript;
        localText.value = voiceword;
      }
    }
    //音声入力ボタンを押すと音声入力
    Voice.addEventListener('click', () => {
      recognition.start();
      voiceword = '';
      //音声入力ができないときにアラートを表示
      if ('SpeechRecognition' in window) {
        // ユーザのブラウザが音声入力に対応しているとき
      } else {
        // ユーザのブラウザが音声入力に対応していないとき
        alert("このブラウザでは音声入力ができません");
      }
    });
  });

  })();
