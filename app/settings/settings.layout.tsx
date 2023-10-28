import { ArchiveIcon, BanIcon, CogIcon } from '@heroicons/react/outline';
import { classNames } from '@utils/classNamesHelper';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const navigation = [
  {
    name: 'Tags',
    icon: CogIcon,
    href: '/settings/tags',
  },
  {
    name: 'Sources',
    icon: ArchiveIcon,
    href: '/settings/sources',
  },
  {
    name: 'Block Number',
    icon: BanIcon,
    href: '/settings/block-number',
  },
];

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname, push } = useRouter();

  useEffect(() => {
    if (!pathname?.slice(1)?.split('/')[1]) {
      push('/settings/tags');
    }
  }, [pathname, push]);

  return (
    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div className="flex gap-6">
        <div className="mt-4 flex min-h-0 w-64 flex-col border-r border-gray-200">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 px-2">
              {navigation.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.name.toLowerCase() === pathname?.slice(1)?.split('/')[1]
                      ? 'bg-gray-500 text-white'
                      : 'bg-white-100 text-black',
                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                  )}>
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0 text-black" aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex h-full w-full flex-1 grow flex-col justify-items-center">{children}</div>
      </div>
    </div>
  );
};

export default SettingsLayout;
