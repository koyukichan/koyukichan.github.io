
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
  const reactext = document.getElementById('reaction-text');   //リアクションテキスト


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

  
  //タイマー、3秒後に文字が消える(関数を定義)
  var timerId;
  function startTimer() {
    timerId = setTimeout( function() {
      reactext.textContent = "";
    } , 3000 );
  }
  //「はい」ボタンを押したときに「はい」と表示して3秒後消える
  yesbtn.addEventListener('click', () => {
    if(reactext.textContent != "はい"){
      reactext.textContent = "はい";
      startTimer();
    }
  });
  //「わからない」ボタンを押したときに「わからない」と表示して3秒後消える
  sosobtn.addEventListener('click', () => {
    if(reactext.textContent != "わからない"){
      reactext.textContent = "わからない";
      startTimer();
    }
  });
  //「いいえ」ボタンを押したときに「いいえ」と表示して3秒後消える
  nobtn.addEventListener('click', () => {
    if(reactext.textContent != "いいえ"){
      reactext.textContent = "いいえ";
      startTimer();
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
