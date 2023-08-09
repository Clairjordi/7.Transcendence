import React, { useState, useEffect, useRef } from 'react';

interface UserSuggestionProps {
  users: string[];
  channels: string[];
  setDMUserName: React.Dispatch<React.SetStateAction<string>>;
  setChannelName: React.Dispatch<React.SetStateAction<string>>;
}

const UserSuggestion: React.FC<UserSuggestionProps> = ({ users, channels, setDMUserName, setChannelName }) => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);

    const filteredUsers = users.filter((user) =>
      user.toLowerCase().includes(value.toLowerCase())
    );

    const filteredChannels = channels.filter((channel) =>
      channel.toLowerCase().includes(value.toLowerCase())
    );

    const combinedSuggestions = filteredUsers.concat(filteredChannels);
    setFilteredNames(combinedSuggestions);
  };

  const handleSelect = (name: string) => {
    setSelectedName(name);
    setSearchValue('');
    setFilteredNames([]);
    if (users.includes(name))
      setDMUserName(name)
    else
      setChannelName(name)
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setFilteredNames([]);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="border-b-1 py-4 px-4">
      <input type="text"
        placeholder="Search channel/user"
        className="py-2 px-2 rounded-lg w-11/12"
        onChange={handleInputChange}
        value={searchValue}
      />
      {filteredNames.length > 0 && (
        <div className=" absolute z-50 bg-white rounded-lg shadow-md mt-2 w-2/12">
          {filteredNames.map((name, index) => (
            <div
              key={index}
              className={`py-2 px-4 cursor-pointer hover:bg-gray-200 ${selectedName === name ? 'bg-gray-200' : ''}`}
              onClick={() => handleSelect(name)}>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSuggestion;