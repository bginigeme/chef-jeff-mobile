// Jest type declarations
import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R
      toBeUndefined(): R
      toContain(item: any): R
      not: Matchers<R>
      toHaveProperty(propertyName: string): R
      toMatchObject(object: Record<string, any>): R
      toHaveBeenCalledWith(...args: any[]): R
      toHaveBeenCalledTimes(times: number): R
      toHaveBeenCalled(): R
      toBeLessThan(value: number): R
      toHaveLength(length: number): R
      toBe(value: any): R
    }

    interface MockedFunction<T extends (...args: any[]) => any> {
      (...args: Parameters<T>): ReturnType<T>
      mockResolvedValue(value: any): this
      mockResolvedValueOnce(value: any): this
      mockRejectedValue(error: any): this
      mock: {
        calls: any[][]
      }
    }

    interface MockedClass<T extends new (...args: any[]) => any> {
      new (...args: any[]): InstanceType<T>
      mockImplementation(fn: (...args: any[]) => any): this
    }

    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T
      mockResolvedValue(value: T): this
      mockResolvedValueOnce(value: T): this
      mockRejectedValue(error: any): this
    }
  }

  var describe: (name: string, fn: () => void) => void
  var test: (name: string, fn: () => void | Promise<void>) => void
  var it: (name: string, fn: () => void | Promise<void>) => void
  var expect: (actual: any) => jest.Matchers<any>
  var beforeEach: (fn: () => void | Promise<void>) => void
  var afterEach: (fn: () => void | Promise<void>) => void
  var beforeAll: (fn: () => void | Promise<void>) => void
  var afterAll: (fn: () => void | Promise<void>) => void
  var jest: {
    fn(): jest.MockedFunction<any>
    mock(moduleName: string, factory?: () => any): void
    clearAllMocks(): void
    setTimeout(timeout: number): void
  }
}

export {} 
 
 