export default function Header() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-800">강사 일정 관리</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">관리자</span>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">A</span>
        </div>
        <button
          onClick={() => alert('프로토타입: 로그아웃 기능 예정')}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
