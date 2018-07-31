pragma solidity ^0.4.3;
contract Game{
    //´´½¨Õß
    address founder;
    
    uint8 betPhase=6;
    
    uint8 commitPhase=6;
    
    uint8 openPhase=6;
    
    uint minValue=0.1 ether;
    
    uint maxParticipant=10;
    
    uint refund=90;
    
    bool finished=true;
    
    uint startBlock;
    
    uint id=0;
    
    struct Participant{
        bytes32 hash;
        bytes32 origin;
        uint value;
        bool committed;
    }
    
   


    struct Bet{
        uint8 betPhase;
        uint8 commitPhase;
        uint8 openPhase;
        uint minValue;
        uint maxParticipant;
        mapping(address=>Participant) participants;
        address[] keys;
        uint totalValue;
        bytes32 luckNumber;
        address lucky;
        bool prized;
        uint refund;
    }
    
    mapping(uint=>Bet) games;
    
    event logBlock(uint,uint);
    
    event logLuckUser(address,uint);
    
    event logCommitOrigin(bytes32);
    
    modifier checkGameFinish(){
        if(finished){
            throw;
        }
        _;
    }
    
    modifier checkFounder(){
        if(msg.sender!=founder){
            throw;
        }
        _;
    }
    
    modifier checkPrized(uint id){
        if(games[id].prized){
            throw;
        }
        _;
    }
    
    modifier checkFihished(){
        if(!finished){
            throw;
        }
        _;
    }
    
    modifier checkId(uint i){
        if(id!=i){
            throw;
        }
        _;
    }
    
    modifier checkValue(uint value){
        if(value<minValue){
            throw;
        }
        _;
    }
    
    modifier checkBetPhase(){
        if(block.number>startBlock+betPhase){
            throw;
        }
        _;
    }
    
    modifier checkCommitPhase(){
        if(block.number>startBlock+betPhase+commitPhase){
            throw;
        }
        _;
    }
    
    modifier checkOpen(){
        logBlock(block.number,startBlock+betPhase+commitPhase);
        if(block.number<startBlock+betPhase+commitPhase){
            throw;
        }
        _;
    }
    
    modifier checkUser(address user,uint id){
        if(games[id].participants[user].hash==""){
            throw;
        }
        _;
    }
    
    modifier checkRegister(uint id,address user){
        if(games[id].participants[user].hash!=""){
            throw;
        }
        _;
    }
    
    function Game() public{
        founder=msg.sender;
    }
    
    function startGame(uint8 betPhase,uint8 commitPhase,uint8 openPhase,uint8 maxParticipant,uint refund) payable
    checkFounder
    checkFihished
    {
        id+=1;
        betPhase=betPhase;
        commitPhase=commitPhase;
        openPhase=openPhase;
        minValue=0.1 ether;
        maxParticipant=maxParticipant;
        finished=false;
        startBlock=block.number;
        refund=refund;
    }
    
    function play(uint id,bytes32 hash) public payable
    checkValue(msg.value)
    checkBetPhase
    checkId(id)
    checkRegister(id,msg.sender)
    {
        address user=msg.sender;
        Bet memory tmp=games[id];
        Participant memory participant=Participant({hash:hash,origin:"",value:msg.value,committed:false});
        if(tmp.keys.length==0){
            Bet storage bet=games[id];
            bet.betPhase=betPhase;
            bet.commitPhase=commitPhase;
            bet.openPhase=openPhase;
            bet.minValue=minValue;
            bet.maxParticipant=maxParticipant;
            bet.keys.push(user);
            bet.participants[user]=participant;
            bet.refund=refund;
        }else{
            games[id].keys.push(user);
            games[id].participants[user]=participant;
        }
    }
    
    function commitOrigin(uint id,bytes32 origin)
    checkCommitPhase
    checkId(id)
    checkUser(msg.sender,id)
    {
        bytes32 hash=games[id].participants[msg.sender].hash;
        if(sha3(origin)==hash){
            logCommitOrigin(origin);
            games[id].participants[msg.sender].committed=true;
            games[id].participants[msg.sender].origin=origin;
            games[id].totalValue+=games[id].participants[msg.sender].value;
        }
    }
    
    function getLuckNumber(Bet storage bet) internal
    returns(bytes32)
    {
        address[] memory users=bet.keys;
        bytes32 random;
        for(uint i=0;i<users.length;i++){
            address key=users[i];
            Participant memory p=bet.participants[key];
            
            if(p.committed==true){
                random ^=p.origin;
            }
        }
        return sha3(random);
    }
    
    function open(uint id)
    checkPrized(id)
    checkFounder
    checkOpen
    checkGameFinish
    {
        bytes32 max=0;
        Bet storage bet=games[id];
        bytes32 random=getLuckNumber(bet);
        address tmp;
        address[] memory users=bet.keys;
        for(uint i=0;i<users.length;i++){
            address key=users[i];
            Participant memory p=bet.participants[key];
            bytes32 distance=random^p.origin;
            if(distance>max){
                max=distance;
                tmp=key;
            }
        }
        bet.lucky=tmp;
        bet.luckNumber=random;
        uint prize=bet.totalValue*refund/100;
        if(tmp.send(prize)){
            bet.prized=true;
            logLuckUser(tmp,bet.totalValue);
        }
        finished=true;
    }

    // public getRandom(uint id) constant{
        
    // } 
    function getId() constant returns(uint){
        return id;
    }
    
    function getRandom(uint id) constant
    checkId(id)
    returns(bytes32){
        return games[id].luckNumber;
    }
    
    function getLuckUser(uint id) constant
    checkId(id)
    returns(address){
        return games[id].lucky;
    }
    
    function getPrizeAmount(uint id) constant
    checkId(id)
    returns(uint){
        return games[id].totalValue;
    }
    
    function getMinAmount(uint id) constant
    checkId(id)
    returns(uint)
    {
        return minValue;
    }
    

}
